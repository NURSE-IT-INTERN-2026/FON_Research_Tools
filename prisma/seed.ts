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
  // Minimal valid PDF with title as text content
  const content = `%PDF-1.0\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n3 0 obj<</Type/Page/MediaBox[0 0 612 792]/Parent 2 0 R/Resources<</Font<</F1 4 0 R>>>>/Contents 5 0 R>>endobj\n4 0 obj<</Type/Font/Subtype/Type1/BaseFont/Helvetica>>endobj\n5 0 obj<</Length 44>>stream\nBT /F1 12 Tf 100 700 Td (${title}) Tj ET\nendstream\nendobj\nxref\n0 6\n0000000000 65535 f \n0000000009 00000 n \n0000000058 00000 n \n0000000115 00000 n \n0000000266 00000 n \n0000000340 00000 n \ntrailer<</Size 6/Root 1 0 R>>\nstartxref\n434\n%%EOF`;
  writeFileSync(filePath, content);
}

async function main() {
  // Admin
  const admin1 = await prisma.profile.create({
    data: {
      id: "admin-001",
      name: "สุภาพร เจริญสุข",
      email: "supapan.ch@cmu.ac.th",
      accountType: "MISEmpAcc",
      cmuItAccount: "supapan_ch",
    },
  });

  // Students
  const student1 = await prisma.profile.create({
    data: {
      id: "student-001",
      name: "สมชาย ใจดี",
      email: "somchai@cmu.ac.th",
      studentId: "621251001",
      accountType: "StdAcc",
      cmuItAccount: "somchai_j",
    },
  });
  const student2 = await prisma.profile.create({
    data: {
      id: "student-002",
      name: "สมหญิง รักเรียน",
      email: "somying@cmu.ac.th",
      studentId: "621251002",
      accountType: "StdAcc",
      cmuItAccount: "somying_r",
    },
  });
  const student3 = await prisma.profile.create({
    data: {
      id: "student-003",
      name: "วิชัย มุ่งมั่น",
      email: "wichai@cmu.ac.th",
      studentId: "621251003",
      accountType: "StdAcc",
      cmuItAccount: "wichai_m",
    },
  });
  const student4 = await prisma.profile.create({
    data: {
      id: "student-004",
      name: "พิมพ์ใจ สวัสดิ์",
      email: "pimjai@cmu.ac.th",
      studentId: "621251004",
      accountType: "StdAcc",
      cmuItAccount: "pimjai_s",
    },
  });

  // Roles
  await prisma.userRole.createMany({
    data: [
      { userId: admin1.id, role: "ADMIN" },
      { userId: student1.id, role: "STUDENT" },
      { userId: student2.id, role: "STUDENT" },
      { userId: student3.id, role: "STUDENT" },
      { userId: student4.id, role: "STUDENT" },
    ],
  });

  // Documents
  const now = new Date();
  const daysAgo = (d: number) => new Date(now.getTime() - d * 86400000);

  await prisma.document.createMany({
    data: [
      // Student 1: 2 approved, 1 pending
      {
        userId: student1.id,
        title: "แบบสอบถามพฤติกรรมสุขภาพ",
        fileName: "621251001_1.pdf",
        originalName: "health_behavior_questionnaire.pdf",
        fileSize: 245000,
        status: "APPROVED",
        approvedBy: admin1.email,
        approvedAt: daysAgo(3),
        createdAt: daysAgo(7),
      },
      {
        userId: student1.id,
        title: "แบบประเมินคุณภาพชีวิต",
        fileName: "621251001_2.pdf",
        originalName: "quality_of_life_assessment.pdf",
        fileSize: 189000,
        status: "APPROVED",
        approvedBy: admin1.email,
        approvedAt: daysAgo(2),
        createdAt: daysAgo(5),
      },
      {
        userId: student1.id,
        title: "แบบวัดความเครียด",
        fileName: "621251001_3.pdf",
        originalName: "stress_scale.pdf",
        fileSize: 156000,
        status: "PENDING",
        createdAt: daysAgo(1),
      },
      // Student 2: 2 approved
      {
        userId: student2.id,
        title: "The Positive Discipline Questionnaire",
        fileName: "621251002_1.pdf",
        originalName: "positive_discipline_questionnaire.pdf",
        fileSize: 312000,
        status: "APPROVED",
        approvedBy: admin1.email,
        approvedAt: daysAgo(4),
        createdAt: daysAgo(10),
      },
      {
        userId: student2.id,
        title: "แบบสัมภาษณ์ผู้ปกครอง",
        fileName: "621251002_2.pdf",
        originalName: "parent_interview_form.pdf",
        fileSize: 278000,
        status: "APPROVED",
        approvedBy: admin1.email,
        approvedAt: daysAgo(3),
        createdAt: daysAgo(8),
      },
      // Student 3: 1 pending, 1 rejected
      {
        userId: student3.id,
        title: "แบบสังเกตพฤติกรรมเด็ก",
        fileName: "621251003_1.pdf",
        originalName: "child_behavior_observation.pdf",
        fileSize: 198000,
        status: "PENDING",
        createdAt: daysAgo(2),
      },
      {
        userId: student3.id,
        title: "แบบวัดพัฒนาการ",
        fileName: "621251003_2.pdf",
        originalName: "developmental_scale.pdf",
        fileSize: 167000,
        status: "REJECTED",
        approvedBy: admin1.email,
        approvedAt: daysAgo(5),
        adminNotes: "ไฟล์ไม่ชัดเจน กรุณาอัปโหลดใหม่",
        createdAt: daysAgo(9),
      },
      // Student 4: 2 pending
      {
        userId: student4.id,
        title: "แบบประเมินภาวะโภชนาการ",
        fileName: "621251004_1.pdf",
        originalName: "nutrition_assessment.pdf",
        fileSize: 223000,
        status: "PENDING",
        createdAt: daysAgo(1),
      },
      {
        userId: student4.id,
        title: "Food Frequency Questionnaire",
        fileName: "621251004_2.pdf",
        originalName: "ffq_thai_version.pdf",
        fileSize: 345000,
        status: "PENDING",
        createdAt: daysAgo(0),
      },
    ],
  });

  // Create seed PDF files on disk
  const seedDocs: { studentId: string; fileName: string; title: string }[] = [
    { studentId: "621251001", fileName: "621251001_1.pdf", title: "แบบสอบถามพฤติกรรมสุขภาพ" },
    { studentId: "621251001", fileName: "621251001_2.pdf", title: "แบบประเมินคุณภาพชีวิต" },
    { studentId: "621251001", fileName: "621251001_3.pdf", title: "แบบวัดความเครียด" },
    { studentId: "621251002", fileName: "621251002_1.pdf", title: "Positive Discipline Questionnaire" },
    { studentId: "621251002", fileName: "621251002_2.pdf", title: "แบบสัมภาษณ์ผู้ปกครอง" },
    { studentId: "621251003", fileName: "621251003_1.pdf", title: "แบบสังเกตพฤติกรรมเด็ก" },
    { studentId: "621251003", fileName: "621251003_2.pdf", title: "แบบวัดพัฒนาการ" },
    { studentId: "621251004", fileName: "621251004_1.pdf", title: "แบบประเมินภาวะโภชนาการ" },
    { studentId: "621251004", fileName: "621251004_2.pdf", title: "Food Frequency Questionnaire" },
  ];
  for (const d of seedDocs) {
    createSeedPdf(d.studentId, d.fileName, d.title);
  }

  // Activity logs
  await prisma.activityLog.createMany({
    data: [
      { action: "USER_LOGIN", userId: admin1.id, targetType: "Profile", targetId: admin1.id, targetLabel: "สุภาพร เจริญสุข", createdAt: daysAgo(0) },
      { action: "USER_LOGIN", userId: student1.id, targetType: "Profile", targetId: student1.id, targetLabel: "สมชาย ใจดี", createdAt: daysAgo(0) },
      { action: "DOCUMENT_UPLOAD", userId: student1.id, targetType: "Document", targetLabel: "สมชาย → แบบวัดความเครียด", createdAt: daysAgo(1) },
      { action: "DOCUMENT_APPROVE", userId: admin1.id, targetType: "Document", targetLabel: "อนุมัติ → แบบประเมินคุณภาพชีวิต", createdAt: daysAgo(2) },
      { action: "DOCUMENT_APPROVE", userId: admin1.id, targetType: "Document", targetLabel: "อนุมัติ → แบบสอบถามพฤติกรรมสุขภาพ", createdAt: daysAgo(3) },
      { action: "DOCUMENT_REJECT", userId: admin1.id, targetType: "Document", targetLabel: "ปฏิเสธ → แบบวัดพัฒนาการ", createdAt: daysAgo(5) },
      { action: "DOCUMENT_UPLOAD", userId: student4.id, targetType: "Document", targetLabel: "พิมพ์ใจ → Food Frequency Questionnaire", createdAt: daysAgo(0) },
      { action: "DOCUMENT_UPLOAD", userId: student4.id, targetType: "Document", targetLabel: "พิมพ์ใจ → แบบประเมินภาวะโภชนาการ", createdAt: daysAgo(1) },
    ],
  });

  console.log("Seed completed:");
  console.log("  5 profiles (1 admin, 4 students)");
  console.log("  5 user roles");
  console.log("  9 documents (4 PENDING, 4 APPROVED, 1 REJECTED)");
  console.log("  8 activity logs");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
