import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { mkdirSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const UPLOAD_DIR = join(process.cwd(), "uploads");

function createSeedPdf(studentId: string, fileName: string, title: string) {
  const folder = join(UPLOAD_DIR, studentId);
  if (!existsSync(folder)) mkdirSync(folder, { recursive: true });
  const filePath = join(folder, fileName);
  const content = `%PDF-1.0\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n3 0 obj<</Type/Page/MediaBox[0 0 612 792]/Parent 2 0 R/Resources<</Font<</F1 4 0 R>>>>/Contents 5 0 R>>endobj\n4 0 obj<</Type/Font/Subtype/Type1/BaseFont/Helvetica>>endobj\n5 0 obj<</Length 44>>stream\nBT /F1 12 Tf 100 700 Td (${title}) Tj ET\nendstream\nendobj\nxref\n0 6\n0000000000 65535 f \n0000000009 00000 n \n0000000058 00000 n \n0000000115 00000 n \n0000000266 00000 n \n0000000340 00000 n \ntrailer<</Size 6/Root 1 0 R>>\nstartxref\n434\n%%EOF`;
  writeFileSync(filePath, content);
}

const THAI_FIRST = ["สมชาย", "สมหญิง", "วิชัย", "พิมพ์ใจ", "สุภาพ", "วีรชัย", "นภา", "กนก", "ประเสริฐ", "จิตรา", "สมศักดิ์", "วันดี", "ธงชัย", "รุ่งนภา", "เกรียงศักดิ์", "ปิยะ", "อรุณ", "มาลี", "บุญมี", "เสรี", "ชูศรี", "สมบูรณ์", "ภูมิพัฒน์", "อรนุช", "กิตติ"];
const THAI_LAST = ["ใจดี", "รักเรียน", "มุ่งมั่น", "สวัสดิ์", "เจริญสุข", "วงศ์สวัสดิ์", "พงษ์ประเสริฐ", "ศรีสุวรรณ", "ธนาพันธุ์", "แก้วมณี", "ชัยชนะ", "รุ่งเรือง", "ภู่เจริญ", "ตรีนิกร", "วิเศษสมบัติ"];
const DOC_TITLES = [
  "แบบสอบถามพฤติกรรมสุขภาพ", "แบบประเมินคุณภาพชีวิต", "แบบวัดความเครียด",
  "แบบสังเกตพฤติกรรมเด็ก", "แบบวัดพัฒนาการ", "แบบประเมินภาวะโภชนาการ",
  "Food Frequency Questionnaire", "แบบสัมภาษณ์ผู้ปกครอง",
  "The Positive Discipline Questionnaire", "แบบวิจัยเชิงปริมาณ",
  "แบบสอบถามภาวะสุขภาพจิต", "แบบประเมินความรู้ด้านสุขภาพ",
  "Patient Health Questionnaire (PHQ-9)", "แบบวัดความพึงพอใจ",
  "แบบสอบถามคุณภาพการนอนหลับ", "แบบประเมินความเสี่ยง",
  "Health Promoting Lifestyle Profile", "แบบวิจัยเชิงคุณภาพ",
  "แบบสังเกตการสาธิต", "แบบบันทึกข้อมูลสุขภาพ",
  "แบบประเมินสมรรถนะ", "แบบวัดทัศนคติ", "แบบสอบถามพฤติกรรมการบริโภค",
  "แบบสัมภาษณ์เชิงลึก", "แบบประเมินความต้องการ",
];

async function main() {
  console.log("Seeding database for pagination testing...\n");

  // Admins
  const admins = await Promise.all([
    prisma.profile.create({
      data: { id: "admin-001", name: "สุภาพร เจริญสุข", email: "supapan.ch@cmu.ac.th", cmuItAccount: "supapan_ch", role: "ADMIN" },
    }),
    prisma.profile.create({
      data: { id: "admin-002", name: "วิริยา พงษ์ประเสริฐ", email: "wirinya.p@cmu.ac.th", cmuItAccount: "wirinya_p", role: "ADMIN" },
    }),
  ]);

  // 30 students (exceeds PAGE_SIZE=20)
  const students = [];
  for (let i = 1; i <= 30; i++) {
    const studentId = `621251${String(i).padStart(3, "0")}`;
    const first = THAI_FIRST[(i - 1) % THAI_FIRST.length];
    const last = THAI_LAST[(i - 1) % THAI_LAST.length];
    const name = `${first} ${last}`;
    students.push(
      await prisma.profile.create({
        data: {
          id: `student-${String(i).padStart(3, "0")}`,
          name,
          email: `${first.toLowerCase()}_${last.toLowerCase()}@cmu.ac.th`,
          studentId,
          cmuItAccount: `${first.toLowerCase()}_${last.toLowerCase()}`,
          role: "STUDENT",
        },
      }),
    );
  }

  // Documents
  const now = new Date();
  const daysAgo = (d: number) => new Date(now.getTime() - d * 86400000);
  const docData: { userId: string; title: string; fileName: string; originalName: string; fileSize: number; status: "PENDING" | "APPROVED" | "REJECTED"; reviewedBy?: string; reviewedAt?: Date; adminNotes?: string; createdAt: Date }[] = [];

  // Student 1: 15 documents (exceeds PAGE_SIZE=10 for detail page)
  for (let i = 0; i < 15; i++) {
    const sid = "621251001";
    const status = i < 6 ? "APPROVED" as const : i < 10 ? "PENDING" as const : "REJECTED" as const;
    docData.push({
      userId: students[0].id,
      title: `${DOC_TITLES[i % DOC_TITLES.length]} (รุ่น ${i + 1})`,
      fileName: `${sid}_${i + 1}.pdf`,
      originalName: `document_v${i + 1}.pdf`,
      fileSize: 100000 + i * 15000,
      status,
      reviewedBy: status !== "PENDING" ? admins[0].email : undefined,
      reviewedAt: status !== "PENDING" ? daysAgo(15 - i) : undefined,
      adminNotes: status === "REJECTED" ? "กรุณาแก้ไขและส่งใหม่" : undefined,
      createdAt: daysAgo(20 - i),
    });
  }

  // Students 2-30: 1-3 documents each
  const statuses: ("PENDING" | "APPROVED" | "REJECTED")[] = ["PENDING", "APPROVED", "REJECTED"];
  for (let s = 1; s < 30; s++) {
    const count = (s % 3) + 1; // 1, 2, or 3 docs
    for (let d = 0; d < count; d++) {
      const status = statuses[(s + d) % 3];
      const sid = `621251${String(s + 1).padStart(3, "0")}`;
      docData.push({
        userId: students[s].id,
        title: `${DOC_TITLES[(s + d) % DOC_TITLES.length]}`,
        fileName: `${sid}_${d + 1}.pdf`,
        originalName: `doc_${d + 1}.pdf`,
        fileSize: 150000 + s * 10000 + d * 5000,
        status,
        reviewedBy: status !== "PENDING" ? admins[s % 2].email : undefined,
        reviewedAt: status !== "PENDING" ? daysAgo(10 - d) : undefined,
        adminNotes: status === "REJECTED" ? "ไฟล์ไม่ชัดเจน" : undefined,
        createdAt: daysAgo(15 - s + d),
      });
    }
  }

  await prisma.document.createMany({ data: docData });

  // Create PDF files on disk for student 1 (15 docs)
  for (let i = 0; i < 15; i++) {
    const sid = "621251001";
    createSeedPdf(sid, `${sid}_${i + 1}.pdf`, `${DOC_TITLES[i % DOC_TITLES.length]} (รุ่น ${i + 1})`);
  }

  // Activity logs: 30 entries (exceeds PAGE_SIZE=20)
  const activityData = [];
  const actions = ["USER_LOGIN", "DOCUMENT_UPLOAD", "DOCUMENT_APPROVE", "DOCUMENT_REJECT", "DOCUMENT_REMOVE"] as const;
  for (let i = 0; i < 30; i++) {
    const user = i % 2 === 0 ? admins[i % 2] : students[i % students.length];
    const action = actions[i % actions.length];
    activityData.push({
      action,
      userId: user.id,
      targetType: action === "USER_LOGIN" ? "Profile" : "Document",
      targetLabel: `${user.name} → ${action}`,
      createdAt: daysAgo(30 - i),
    });
  }
  await prisma.activityLog.createMany({ data: activityData });

  console.log("Seed completed:");
  console.log(`  ${admins.length} admins`);
  console.log(`  ${students.length} students`);
  console.log(`  ${docData.length} documents`);
  console.log(`  ${activityData.length} activity logs`);
  console.log(`\nPagination test:`);
  console.log(`  Students page (20/page): needs ${students.length} → ${(students.length / 20) + 1} pages ✓`);
  console.log(`  Users page (20/page): needs ${admins.length + students.length} → ${Math.ceil((admins.length + students.length) / 20)} pages ✓`);
  console.log(`  Student detail docs (10/page): student 1 has 15 docs → 2 pages ✓`);
  console.log(`  Activity log (20/page): ${activityData.length} entries → 2 pages ✓`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
