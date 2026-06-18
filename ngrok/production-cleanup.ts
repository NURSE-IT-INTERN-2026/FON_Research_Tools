/**
 * Production Cleanup Script
 *
 * ลบ mock data ที่ใช้ตอน demo ออกจาก DB เพื่อเตรียม production
 *
 * สิ่งที่ลบ/แก้:
 *   1. BorrowingRecord ทั้งหมด (mock)
 *   2. Profile ที่ id LIKE 'student-%' (30 mock students) — cascade ไปยัง Document + ActivityLog ของพวกเขา
 *   3. Reset admin-001/admin-002 name เป็น placeholder + nameFromCmu=false (ชื่อจริงจะมาจาก CMU login)
 *
 * สิ่งที่ไม่แตะ:
 *   - นักศึกษาจริงจาก Thesis API sync (id LIKE 'thesis-%')
 *   - admin อื่น ๆ (เช่น parin_p ที่ login จริงแล้ว)
 *   - ActivityLog ของ admin (USER_LOGIN เป็นต้น)
 *
 * วิธีรัน:
 *   npx tsx production-cleanup.ts
 *
 * Idempotent: รันซ้ำก็ปลอดภัย (ถ้าไม่มี mock data จะ skip)
 *
 * หลักรันเสร็จ:
 *   1. สร้าง admin จริงผ่านหน้า UI (เฉพาะ email — ชื่อจะมาจาก CMU login)
 *   2. กด sync ใน /admin/students เพื่อดึงนักศึกษาจริงจาก Thesis API
 */
import "dotenv/config";
import db from "@/lib/db";

const PLACEHOLDER_NAME = "รอเข้าสู่ระบบครั้งแรก";

async function showStats(label: string) {
  const [students, mockStudents, admins, docs, borrows, logs] = await Promise.all([
    db.profile.count({ where: { role: "STUDENT" } }),
    db.profile.count({ where: { id: { startsWith: "student-" } } }),
    db.profile.count({ where: { role: "ADMIN" } }),
    db.document.count(),
    db.borrowingRecord.count(),
    db.activityLog.count(),
  ]);
  console.log(`\n=== ${label} ===`);
  console.log(`  Total students:    ${students}`);
  console.log(`  Mock students:     ${mockStudents} (id LIKE 'student-%')`);
  console.log(`  Admins:            ${admins}`);
  console.log(`  Documents:         ${docs}`);
  console.log(`  Borrowing records: ${borrows}`);
  console.log(`  Activity logs:     ${logs}`);
}

async function main() {
  console.log("=".repeat(60));
  console.log("PRODUCTION CLEANUP — remove mock data");
  console.log("=".repeat(60));

  await showStats("BEFORE");

  await db.$transaction(async (tx) => {
    // 1. Delete all borrowing records (all mock)
    const delBorrows = await tx.borrowingRecord.deleteMany({});
    console.log(`\n[1/3] Deleted ${delBorrows.count} borrowing records`);

    // 2. Delete mock students (cascade deletes their documents + their activity logs)
    const delStudents = await tx.profile.deleteMany({
      where: { id: { startsWith: "student-" } },
    });
    console.log(`[2/3] Deleted ${delStudents.count} mock students (cascade: their docs + logs)`);

    // 3. Reset admin-001/admin-002 names to placeholder
    const resetAdmins = await tx.profile.updateMany({
      where: { id: { in: ["admin-001", "admin-002"] } },
      data: { name: PLACEHOLDER_NAME, nameFromCmu: false },
    });
    console.log(`[3/3] Reset ${resetAdmins.count} admin names to placeholder`);
  });

  console.log(`\nTransaction committed.`);
  await showStats("AFTER");

  console.log("\n" + "=".repeat(60));
  console.log("NEXT STEPS");
  console.log("=".repeat(60));
  console.log("1. สร้าง admin จริงผ่านหน้า /admin/admins (เฉพาะ email)");
  console.log("   เมื่อ admin login ผ่าน CMU OAuth ชื่อจริงจะถูกดึงมาอัตโนมัติ");
  console.log("2. กด sync ที่หน้า /admin/students เพื่อดึงนักศึกษาจริงจาก Thesis API");
  console.log("3. ลบไฟล์นี้ทิ้งหลังใช้งานเสร็จ:");
  console.log("   rm production-cleanup.ts seed-demo.ts");
}

main().catch((e) => {
  console.error("Cleanup failed:", e);
  process.exit(1);
}).finally(() => process.exit(0));
