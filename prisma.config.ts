import { config } from "dotenv";
// Load in Next.js order: .env first, .env.local overrides. Without this, Prisma
// commands (migrate, db push) hit whatever DATABASE_URL is in .env (e.g. Neon)
// instead of the local DB the dev server actually uses.
config({ path: ".env" });
config({ path: ".env.local", override: true });
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    // Seed is intentionally not configured here. prisma/seed.ts creates mock data
    // for local development only and is gitignored. To seed a fresh dev DB, run:
    //   npx tsx prisma/seed.ts
    // Production never seeds — admins come from CMU OAuth, students from Thesis API.
  },
  datasource: {
    url: env("DATABASE_URL"),
  },
});
