import "dotenv/config";
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
