import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import db from "@/lib/db";

const THESIS_API_URL = process.env.THESIS_API_URL;
const THESIS_API_TOKEN = process.env.THESIS_API_TOKEN;

export async function POST() {
  await requireRole("ADMIN");

  if (!THESIS_API_URL || !THESIS_API_TOKEN) {
    return NextResponse.json(
      { error: "ไม่ได้ตั้งค่า Thesis API" },
      { status: 500 },
    );
  }

  let json: { students?: Array<{
    student_id: string;
    title_th: string;
    title_en: string;
    major_th: string;
    level_name_th: string;
    curriculum: string;
    cmu_account: string;
  }> };

  try {
    const res = await fetch(`${THESIS_API_URL}`, {
      method: "POST",
      headers: {
        Authorization: THESIS_API_TOKEN,
        "Content-Length": "0",
      },
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: "ดึงข้อมูลจาก Thesis API ไม่สำเร็จ" },
        { status: 502 },
      );
    }

    json = await res.json();
  } catch {
    return NextResponse.json(
      { error: "ไม่สามารถเชื่อมต่อ Thesis API ได้" },
      { status: 502 },
    );
  }
  const students = json.students ?? [];

  let created = 0;
  let updated = 0;

  for (const s of students) {
    const hasTitle = s.title_th && s.title_th !== "N/A";
    const email = s.cmu_account || `${s.student_id}@placeholder.cmu.ac.th`;
    const name = s.cmu_account
      ? s.cmu_account.split("@")[0].replace(/[._]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
      : s.student_id;

    const existing = await db.profile.findFirst({
      where: {
        OR: [
          { studentId: s.student_id },
          ...(s.cmu_account ? [{ email: s.cmu_account }] : []),
        ],
      },
    });

    if (existing) {
      await db.profile.update({
        where: { id: existing.id },
        data: {
          studentId: s.student_id,
          ...(s.level_name_th ? { level: s.level_name_th } : {}),
          ...(hasTitle ? { thesisTitleTh: s.title_th, thesisTitleEn: s.title_en } : {}),
          ...(s.cmu_account ? { cmuItAccount: s.cmu_account.split("@")[0] } : {}),
          ...(s.cmu_account ? { email: s.cmu_account } : {}),
          ...(s.cmu_account ? { name } : {}),
        },
      });
      updated++;
    } else {
      await db.profile.create({
        data: {
          id: `thesis-${s.student_id}`,
          name,
          email,
          studentId: s.student_id,
          cmuItAccount: s.cmu_account ? s.cmu_account.split("@")[0] : null,
          role: "STUDENT",
          level: s.level_name_th || null,
          thesisTitleTh: hasTitle ? s.title_th : null,
          thesisTitleEn: hasTitle ? s.title_en : null,
        },
      });
      created++;
    }
  }

  return NextResponse.json({
    total: students.length,
    created,
    updated,
  });
}
