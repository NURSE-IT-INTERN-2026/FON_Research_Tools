import prisma from "@/lib/db";

const TENANT_ID = process.env.CMU_TENANT_ID;
const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const REDIRECT_URI = process.env.REDIRECT_URL;
const SCOPE = process.env.SCOPE;
const TOKEN_URL = process.env.CMU_GET_TOKEN;
const BASIC_INFO_URL = process.env.CMU_BASIC_INFO;

// --- Mock thesis data for dev testing ---
const MOCK_THESIS = {
  student_id: "621251008",
  title_th:
    "ประสิทธิผลของโปรแกรมส่งเสริมสุขภาพการได้ยินในคนงานโรงงานอุตสาหกรรมขนาดใหญ่",
  title_en:
    "Effectiveness of the Healthy Hearing Promoting Program Among Workers in Large-Scale Industries",
  major_th: "พยาบาลศาสตร์",
  level_name_th: "ปริญญาโท",
  curriculum: "หลักสูตรปกติ",
};

export type CmuUserInfo = {
  cmuitaccount: string;
  cmuitaccount_name: string;
  firstname_TH: string;
  lastname_TH: string;
  firstname_EN: string;
  lastname_EN: string;
  email: string;
  student_id: string;
  organization_code: string;
  itaccount_type_id: string;
};

export type ThesisData = {
  student_id: string;
  title_th: string;
  title_en: string;
  major_th: string;
  level_name_th: string;
  curriculum: string;
} | null;

export function getAuthorizationUrl(state: string) {
  const params = new URLSearchParams({
    client_id: CLIENT_ID!,
    response_type: "code",
    redirect_uri: REDIRECT_URI!,
    scope: SCOPE!,
    response_mode: "query",
    state,
  });
  return `https://login.microsoftonline.com/${TENANT_ID}/oauth2/v2.0/authorize?${params}`;
}

export async function exchangeCodeForToken(code: string) {
  const res = await fetch(TOKEN_URL!, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      client_id: CLIENT_ID!,
      client_secret: CLIENT_SECRET!,
      code,
      redirect_uri: REDIRECT_URI!,
      scope: SCOPE!,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Token exchange failed: ${res.status} ${text}`);
  }

  const data = await res.json();
  return data.access_token as string;
}

export async function getUserBasicInfo(accessToken: string) {
  const res = await fetch(BASIC_INFO_URL!, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    throw new Error(`Basic info fetch failed: ${res.status}`);
  }

  const json = await res.json();
  return json as CmuUserInfo;
}

export async function getThesisData(studentId: string): Promise<ThesisData> {
  if (process.env.MOCK_THESIS === "true") {
    const mockId = process.env.DEV_TEST_STUDENT_ID || studentId; // dev only
    return { ...MOCK_THESIS, student_id: mockId };
  }

  const thesisUrl = process.env.THESIS_API_URL;
  const thesisToken = process.env.THESIS_API_TOKEN;
  if (!thesisUrl || !thesisToken) return null;

  try {
    const res = await fetch(`${thesisUrl}?student_id=${studentId}`, {
      method: "POST",
      headers: { Authorization: thesisToken },
    });

    if (!res.ok) return null;

    const json = await res.json();
    if (!json.count || !json.students?.length) return null;

    const s = json.students[0];
    return {
      student_id: s.student_id,
      title_th: s.title_th,
      title_en: s.title_en,
      major_th: s.major_th,
      level_name_th: s.level_name_th,
      curriculum: s.curriculum,
    };
  } catch {
    return null;
  }
}

export async function getThesisDataAndCache(userId: string): Promise<ThesisData> {
  const profile = await prisma.profile.findUnique({
    where: { id: userId },
    select: { studentId: true },
  });
  if (!profile?.studentId) return null;

  const thesis = await getThesisData(profile.studentId);
  if (thesis) {
    await prisma.profile.update({
      where: { id: userId },
      data: { thesisTitleTh: thesis.title_th, thesisTitleEn: thesis.title_en },
    });
  }
  return thesis;
}

export async function determineRole(
  cmuitaccount?: string,
): Promise<"ADMIN" | "STUDENT" | null> {
  if (process.env.DEV_FORCE_ROLE === "ADMIN") return "ADMIN";
  if (process.env.DEV_FORCE_ROLE === "STUDENT") return "STUDENT";

  if (cmuitaccount) {
    const email = cmuitaccount.includes("@")
      ? cmuitaccount.toLowerCase()
      : `${cmuitaccount.toLowerCase()}@cmu.ac.th`;

    const existing = await prisma.profile.findFirst({
      where: { role: "ADMIN", email },
    });

    if (existing) return "ADMIN";
  }

  return "STUDENT";
}

export async function upsertUser(userInfo: CmuUserInfo, role: "ADMIN" | "STUDENT") {
  const name = `${userInfo.firstname_TH} ${userInfo.lastname_TH}`.trim();
  const email =
    userInfo.email ||
    (userInfo.cmuitaccount.includes("@")
      ? userInfo.cmuitaccount
      : `${userInfo.cmuitaccount}@cmu.ac.th`);
  const studentId = userInfo.student_id || null;

  let thesisTitleTh: string | null = null;
  let thesisTitleEn: string | null = null;
  if (role === "STUDENT" && studentId) {
    const thesis = await getThesisData(studentId);
    if (thesis) {
      thesisTitleTh = thesis.title_th;
      thesisTitleEn = thesis.title_en;
    }
  }

  const data = {
    name,
    email,
    studentId,
    cmuItAccount: userInfo.cmuitaccount,
    role,
    thesisTitleTh,
    thesisTitleEn,
  };

  // Profile may already exist (created via admin panel with different id)
  const existing = await prisma.profile.findUnique({ where: { email } });
  if (existing) {
    return prisma.profile.update({ where: { id: existing.id }, data });
  }

  return prisma.profile.upsert({
    where: { id: userInfo.cmuitaccount },
    create: { id: userInfo.cmuitaccount, ...data },
    update: data,
  });
}
