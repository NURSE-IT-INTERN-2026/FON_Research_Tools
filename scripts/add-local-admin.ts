/**
 * Add super-admin@local to the local DB (bypassing Prisma adapter).
 * Loads env in Next.js order (.env then .env.local override).
 *
 * Run: npx tsx scripts/add-local-admin.ts
 */
import { config } from "dotenv";

config({ path: ".env" });
config({ path: ".env.local", override: true });

import pg from "pg";

async function main() {
  const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  const url = process.env.DATABASE_URL ?? "";
  const m = url.match(/@([^/?]+)\/([^?]+)/);
  console.log("Connected to:", m?.[1], "/", m?.[2]);

  const exists = await client.query(
    `SELECT id, email FROM "Profile" WHERE email LIKE '%@local' AND role = 'ADMIN'`,
  );
  if (exists.rows.length > 0) {
    console.log("Already exists:", exists.rows[0]);
    await client.end();
    return;
  }

  await client.query(`
    INSERT INTO "Profile" (id, name, email, role, "nameFromCmu", "borrowCount", "createdAt", "updatedAt")
    VALUES ('super-admin', 'Super Admin', 'super-admin@local', 'ADMIN', false, 0, NOW(), NOW())
  `);
  console.log("Inserted super-admin@local");

  const count = await client.query(
    `SELECT COUNT(*)::int AS n FROM "Profile" WHERE role = 'ADMIN'`,
  );
  console.log("Total admins now:", count.rows[0].n);

  await client.end();
}

main().catch((e) => {
  console.error("Failed:", e.message);
  process.exit(1);
});
