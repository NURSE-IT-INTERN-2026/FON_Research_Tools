# Research Tools — ระบบจัดการเอกสารเครื่องมือวิจัย

ระบบสำหรับคณะพยาบาลศาสตร์ มหาวิทยาลัยเชียงใหม่ ให้นักศึกษาอัปโหลดเอกสารเครื่องมือวิจัย (PDF) และเจ้าหน้าที่อนุมัติ/ปฏิเสธ

## Getting Started

```bash
# Start PostgreSQL
docker compose up -d

# Apply schema
npx prisma migrate dev

# Seed test data
npx prisma db seed

# Run dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Test Accounts (after seed)

| Role | Email | Password |
|---|---|---|
| Admin | admin@cmu.ac.th | password123 |
| Student | student1@cmu.ac.th | password123 |

## Tech Stack

- Next.js 16 (App Router) + React 19 + TypeScript
- PostgreSQL + Prisma 7
- Tailwind CSS v4 + shadcn/ui
- Custom auth (HMAC-SHA256 session tokens)

## Docs

See `docs/` for full documentation. Start with `docs/phasing-plan.md`.
