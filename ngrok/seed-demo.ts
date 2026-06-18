import "dotenv/config";
import db from "@/lib/db";

// Same arrays as prisma/seed.ts (so names match what seed.ts would have created)
const THAI_FIRST = ["สมชาย", "สมหญิง", "วิชัย", "พิมพ์ใจ", "สุภาพ", "วีรชัย", "นภา", "กนก", "ประเสริฐ", "จิตรา", "สมศักดิ์", "วันดี", "ธงชัย", "รุ่งนภา", "เกรียงศักดิ์", "ปิยะ", "อรุณ", "มาลี", "บุญมี", "เสรี", "ชูศรี", "สมบูรณ์", "ภูมิพัฒน์", "อรนุช", "กิตติ"];
const THAI_LAST = ["ใจดี", "รักเรียน", "มุ่งมั่น", "สวัสดิ์", "เจริญสุข", "วงศ์สวัสดิ์", "พงษ์ประเสริฐ", "ศรีสุวรรณ", "ธนาพันธุ์", "แก้วมณี", "ชัยชนะ", "รุ่งเรือง", "ภู่เจริญ", "ตรีนิกร", "วิเศษสมบัติ"];

// Borrowing requesters (people who borrow on behalf of students)
const REQUESTERS = [
  "ผศ. ดร. อนันต์ สง่า",
  "รศ. ดร. มนัส วัฒนา",
  "นางสาวนภาพร ตั้งใจ",
  "นายประยุทธ ศรีสุข",
  "ผศ. ดร. จันทรา บุญมี",
  "นางสาวปิยะดา รักไทย",
  "นายวีระพงษ์ ใจเย็น",
  "รศ. ดร. สมหมาย พงษ์ไพบูลย์",
];

const SOURCES = [
  "มหาวิทยาลัยเชียงใหม่",
  "มหาวิทยาลัยแม่ฟ้าหลวง",
  "มหาวิทยาลัยขอนแก่น",
  "มหาวิทยาลัยธรรมศาสตร์",
  "สถาบันวิจัยระบบสาธารณสุข",
  "โรงพยาบาลมหาราชนครเชียงใหม่",
];

const DETAILS = [
  "ใช้สำหรับวิทยานิพนธ์ระดับปริญญาเอก",
  "เก็บข้อมูลในโรงพยาบาลชุมชน 3 แห่ง",
  "วิจัยเกี่ยวกับสุขภาพผู้สูงอายุ",
  "เก็บข้อมูลกลุ่มตัวอย่าง 200 คน",
  "โครงการวิจัยร่วมกับต่างประเทศ",
  "ใช้ในงานวิจัยบัณฑิตศึกษา",
];

async function main() {
  // === STEP 1: Restore seeded student names + set nameFromCmu=true ===
  console.log("Step 1: Restoring seeded student names...");
  let restored = 0;
  for (let i = 1; i <= 30; i++) {
    const id = `student-${String(i).padStart(3, "0")}`;
    const first = THAI_FIRST[(i - 1) % THAI_FIRST.length];
    const last = THAI_LAST[(i - 1) % THAI_LAST.length];
    const name = `${first} ${last}`;

    const result = await db.profile.updateMany({
      where: { id },
      data: { name, nameFromCmu: true },
    });
    if (result.count > 0) restored++;
  }
  console.log(`  ✓ Restored ${restored}/30 student names`);

  // === STEP 2: Fix admin names ===
  console.log("Step 2: Fixing admin names...");
  const admin1 = await db.profile.updateMany({
    where: { id: "admin-001" },
    data: { name: "สุภาพร เจริญสุข", nameFromCmu: true },
  });
  const admin2 = await db.profile.updateMany({
    where: { id: "admin-002" },
    data: { name: "วิริยา พงษ์ประเสริฐ", nameFromCmu: true },
  });
  console.log(`  ✓ admin-001: ${admin1.count} row(s), admin-002: ${admin2.count} row(s)`);

  // === STEP 3: Seed borrowing records ===
  console.log("Step 3: Seeding borrowing records...");
  // Skip if already has records (idempotent)
  const existing = await db.borrowingRecord.count();
  if (existing > 0) {
    console.log(`  ✓ Already has ${existing} records, skipping`);
  } else {
    const students = await db.profile.findMany({
      where: { id: { startsWith: "student-" } },
      select: { id: true, name: true },
      orderBy: { id: "asc" },
      take: 10,
    });
    const admins = await db.profile.findMany({
      where: { role: "ADMIN" },
      select: { id: true },
      take: 2,
    });
    const now = new Date();
    const daysAgo = (d: number) => new Date(now.getTime() - d * 86400000);

    const records = [];
    for (let i = 0; i < 8; i++) {
      const student = students[i % students.length];
      const admin = admins[i % admins.length];
      records.push({
        ownerUserId: student.id,
        requesterName: REQUESTERS[i % REQUESTERS.length],
        requestDate: daysAgo(i * 3 + 1),
        source: SOURCES[i % SOURCES.length],
        additionalDetails: DETAILS[i % DETAILS.length],
        createdBy: admin.id,
      });
    }
    await db.borrowingRecord.createMany({ data: records });
    console.log(`  ✓ Created ${records.length} borrowing records`);
  }

  console.log("\nDone.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
}).finally(() => process.exit(0));
