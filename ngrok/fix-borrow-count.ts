/**
 * One-time fix: recalculate Profile.borrowCount from actual BorrowingRecord rows.
 *
 * Background: ngrok/seed-demo.ts originally used createMany without incrementing
 * the cached borrowCount column, so every profile showed 0 even though they had
 * records. This script recomputes the value from the source of truth.
 *
 * Idempotent: safe to run multiple times — it always sets the absolute count.
 *
 * Run: npx tsx ngrok/fix-borrow-count.ts
 */
import "dotenv/config";
import db from "@/lib/db";

async function main() {
  const result = await db.$queryRaw<Array<{ ownerUserId: string; count: bigint }>>`
    SELECT "ownerUserId", COUNT(*)::bigint AS count
    FROM "BorrowingRecord"
    GROUP BY "ownerUserId"
  `;

  console.log(`Found ${result.length} owners with borrowing records`);

  for (const row of result) {
    await db.profile.update({
      where: { id: row.ownerUserId },
      data: { borrowCount: Number(row.count) },
    });
    console.log(`  ✓ ${row.ownerUserId}: borrowCount = ${row.count}`);
  }

  // Also reset any profile whose count is stale-positive (records were deleted
  // outside the normal flow). Set borrowCount = 0 for owners with no records.
  const staleProfiles = await db.profile.findMany({
    where: { borrowCount: { not: 0 } },
    select: { id: true, borrowCount: true },
  });
  const ownersWithRecords = new Set(result.map((r) => r.ownerUserId));
  for (const p of staleProfiles) {
    if (!ownersWithRecords.has(p.id)) {
      await db.profile.update({
        where: { id: p.id },
        data: { borrowCount: 0 },
      });
      console.log(`  ✓ ${p.id}: borrowCount reset to 0 (no records)`);
    }
  }

  console.log("\nDone.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
}).finally(() => process.exit(0));
