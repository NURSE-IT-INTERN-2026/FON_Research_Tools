import prisma from "@/lib/db";

const TENANT_ID = process.env.CMU_TENANT_ID;
const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const REDIRECT_URI = process.env.REDIRECT_URL;
const SCOPE = process.env.SCOPE;
const TOKEN_URL = process.env.CMU_GET_TOKEN;
const BASIC_INFO_URL = process.env.CMU_BASIC_INFO;
const EMAIL_DOMAIN = process.env.EMAIL_DOMAIN ?? "cmu.ac.th";

const REQUIRED_OAUTH_VARS = [
  ["CMU_TENANT_ID", TENANT_ID],
  ["CLIENT_ID", CLIENT_ID],
  ["CLIENT_SECRET", CLIENT_SECRET],
  ["REDIRECT_URL", REDIRECT_URI],
  ["SCOPE", SCOPE],
  ["CMU_GET_TOKEN", TOKEN_URL],
  ["CMU_BASIC_INFO", BASIC_INFO_URL],
] as const;

for (const [name, value] of REQUIRED_OAUTH_VARS) {
  if (!value) throw new Error(`Missing required env var: ${name}`);
}

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
  organization_name_TH?: string;
  organization_name_EN?: string;
  itaccounttype_id: string;
  itaccounttype_TH?: string;
  itaccounttype_EN?: string;
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
    client_id: CLIENT_ID as string,
    response_type: "code",
    redirect_uri: REDIRECT_URI as string,
    scope: SCOPE as string,
    response_mode: "query",
    state,
  });
  return `https://login.microsoftonline.com/${TENANT_ID}/oauth2/v2.0/authorize?${params}`;
}

export async function exchangeCodeForToken(code: string) {
  const res = await fetch(TOKEN_URL as string, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      client_id: CLIENT_ID as string,
      client_secret: CLIENT_SECRET as string,
      code,
      redirect_uri: REDIRECT_URI as string,
      scope: SCOPE as string,
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
  const res = await fetch(BASIC_INFO_URL as string, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    throw new Error(`Basic info fetch failed: ${res.status}`);
  }

  const json = await res.json();
  return json as CmuUserInfo;
}

export async function getThesisData(studentId: string): Promise<ThesisData> {
  if (process.env.NODE_ENV !== "production" && process.env.MOCK_THESIS === "true") {
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
  userInfo: CmuUserInfo,
): Promise<"ADMIN" | "STUDENT" | null> {
  if (process.env.NODE_ENV !== "production") {
    if (process.env.DEV_FORCE_ROLE === "ADMIN") return "ADMIN";
    if (process.env.DEV_FORCE_ROLE === "STUDENT") return "STUDENT";
  }

  // Block alumni accounts explicitly — they should not access the system.
  // Verified against CMU MIS API v3 response (2026-06-16): itaccounttype_id == "AlumAcc".
  if (userInfo.itaccounttype_id === "AlumAcc") return null;

  // Admin: must be pre-registered in DB with role ADMIN.
  // This keeps admin onboarding explicit (an existing admin adds the email first).
  if (userInfo.cmuitaccount) {
    const email = userInfo.cmuitaccount.includes("@")
      ? userInfo.cmuitaccount.toLowerCase()
      : `${userInfo.cmuitaccount.toLowerCase()}@${EMAIL_DOMAIN}`;
    const existing = await prisma.profile.findFirst({
      where: { role: "ADMIN", email },
    });
    if (existing) return "ADMIN";
  }

  // Default: all other CMU account types (StdAcc, MISEmpAcc, etc.) → STUDENT.
  return "STUDENT";
}

export async function upsertUser(userInfo: CmuUserInfo, role: "ADMIN" | "STUDENT") {
  const name = `${userInfo.firstname_TH} ${userInfo.lastname_TH}`.trim();
  const email =
    userInfo.email ||
    (userInfo.cmuitaccount.includes("@")
      ? userInfo.cmuitaccount
      : `${userInfo.cmuitaccount}@${EMAIL_DOMAIN}`);
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
    nameFromCmu: true,
    email,
    studentId,
    cmuItAccount: userInfo.cmuitaccount,
    role,
    thesisTitleTh,
    thesisTitleEn,
  };

  // Profile may already exist: check by email, studentId, or cmuItAccount
  const existing = (await prisma.profile.findUnique({ where: { email } })) ||
    (studentId ? await prisma.profile.findFirst({ where: { studentId } }) : null) ||
    (await prisma.profile.findFirst({ where: { cmuItAccount: userInfo.cmuitaccount } }));

  if (existing) {
    return prisma.profile.update({
      where: { id: existing.id },
      data: {
        ...data,
        thesisTitleTh: thesisTitleTh ?? existing.thesisTitleTh,
        thesisTitleEn: thesisTitleEn ?? existing.thesisTitleEn,
      },
    });
  }

  return prisma.profile.create({
    data: { id: userInfo.cmuitaccount, ...data },
  });
}
