# Research Tools — ระบบจัดการเอกสารเครื่องมือวิจัย

ระบบสำหรับ **คณะพยาบาลศาสตร์ มหาวิทยาลัยเชียงใหม่** ให้นักศึกษาอัปโหลดเอกสารเครื่องมือวิจัย (PDF) และเจ้าหน้าที่ตรวจอนุมัติ/ปฏิเสธ พร้อมบันทึกการยืม-คืนเอกสาร

## ฟีเจอร์หลัก

- **CMU OAuth Login** — เข้าสู่ระบบผ่านบัญชี CMU Account (จำกัดเฉพาะคณะพยาบาลศาสตร์)
- **Document Management** — นักศึกษาอัปโหลด PDF, เจ้าหน้าที่อนุมัติ/ปฏิเสธ พร้อม activity log
- **Thesis API Integration** — ดึงข้อมูลวิทยานิพนธ์นักศึกษาแบบ real-time (ไม่เก็บใน DB)
- **Borrowing Records** — บันทึกการยืมเอกสารจากบุคคลภายนอก
- **Email Notifications** — ส่งอีเมลแจ้งเตือนผ่าน CMU Email API
- **PDF Download & Certificate** — ดาวน์โหลดเอกสารและใบรับรอง
- **RBAC** — แยกสิทธิ์ ADMIN / STUDENT ทั้ง UI และ API

## Tech Stack

- **Framework**: Next.js 16 (App Router) + React 19 + TypeScript
- **Database**: PostgreSQL + Prisma 7
- **Auth**: CMU OAuth 2.0 + HMAC-SHA256 session tokens
- **UI**: Tailwind CSS v4 + shadcn/ui + Radix UI
- **Other**: bcryptjs, pdfkit, exceljs, sonner

## ข้อกำหนดเบื้องต้น

- Node.js 24+ (ดู `.nvmrc`)
- PostgreSQL 14+
- บัญชี CMU Account (สำหรับ OAuth)
- การเข้าถึง CMU Email API และ Thesis API

## Quick Start (Development)

```bash
# 1. Clone และติดตั้ง dependencies
git clone <repo-url>
cd research_tools
npm ci

# 2. ตั้งค่า environment
cp .env.example .env            # base config (production-like)
cp .env.local.example .env.local  # dev overrides + DEV_* vars
# แก้ค่าใน .env และ .env.local ตามเครื่องของคุณ

# 3. ตั้งค่า database
npx prisma migrate deploy       # apply migrations
npx prisma generate             # generate client

# 4. (ถ้าต้องการ) Seed mock data สำหรับ dev
npx tsx prisma/seed.ts

# 5. รัน dev server
npm run dev
# → http://localhost:4141/researchtool
```

## Environment Variables

| ไฟล์ | วัตถุประสงค์ | Git tracked |
|---|---|---|
| `.env.example` | **Production template** — เฉพาะ prod vars | ✓ committed |
| `.env.local.example` | **Dev template** — overrides + DEV_* vars | ✓ committed |
| `.env` | Production values (เอาจริง) | ✗ gitignored |
| `.env.local` | Dev values (เอาจริง) | ✗ gitignored |

ดูคำอธิบายของแต่ละ var ในไฟล์ `.env.example` และ `.env.local.example` ได้เลย

## Scripts

| คำสั่ง | รายการ |
|---|---|
| `npm run dev` | รัน dev server (port 4141) |
| `npm run build` | build production |
| `npm start` | รัน production server (port 4141) |
| `npm run lint` | ตรวจ ESLint |
| `npx prisma migrate deploy` | apply migrations |
| `npx prisma generate` | regenerate Prisma client |
| `npx tsx prisma/seed.ts` | seed mock data (dev only) |
| `npx tsx ngrok/seed-admins.ts` | pre-register real admins |
| `npx tsx ngrok/fresh-reset.ts` | wipe all + create super-admin |
| `npx tsx ngrok/production-cleanup.ts` | wipe mock data ก่อน prod |

## โครงสร้างโปรเจค

```
research_tools/
├── src/
│   ├── app/                    # Next.js App Router (pages + API routes)
│   │   ├── admin/              # admin portal (purple theme)
│   │   ├── thesis/             # student portal (orange theme)
│   │   └── api/                # API routes (auth, documents, students, etc.)
│   ├── actions/                # Server Actions
│   ├── components/             # React components (ui/, admin/, student/)
│   ├── lib/                    # auth, db, email, security, thesis, etc.
│   └── middleware/             # shared utilities
├── prisma/
│   ├── schema.prisma           # database schema
│   ├── migrations/             # SQL migrations
│   └── seed.ts                 # dev seed (gitignored)
├── uploads/                    # uploaded PDFs (gitignored)
├── docs/                       # documentation
├── ngrok/                      # admin scripts (gitignored)
├── proxy.ts                    # Next.js proxy (RBAC + routing)
├── next.config.ts              # Next.js config (basePath, security headers)
└── prisma.config.ts            # Prisma config
```

## Authentication Flow

1. **นักศึกษา/เจ้าหน้าที่ทั่วไป** → กด "เข้าสู่ระบบด้วย CMU Account" → OAuth flow
2. **CMU OAuth callback** → เช็ค:
   - Alumni (`AlumAcc`) → block
   - เป็นคณะพยาบาลศาสตร์ (ดูจาก Thesis API `major_th`) → ผ่าน
   - Pre-registered admin ใน DB → เข้าสู่ระบบเป็น ADMIN
   - นักศึกษาพยาบาล → เข้าสู่ระบบเป็น STUDENT
3. **Super Admin (bootstrap)** → local login ด้วย username/password (ปิดได้ใน prod)

## Production Deployment

ดู checklist ละเอียดใน `.env.example` (ด้านล่างไฟล์) สรุปสั้นๆ:

```bash
# บน production server
cp .env.example .env            # แล้วกรอก prod secrets
npx prisma migrate deploy
npm ci && npm run build
mkdir -p uploads && chmod 755 uploads
npm start                       # หรือใช้ PM2/systemd

# แล้ว login เป็น super-admin → sync students → ทดสอบ OAuth + email
```

**สำคัญ:**
- `ADMIN_LOCAL_LOGIN_ENABLED="false"` (ใช้ CMU OAuth เป็นทางเข้า admin)
- `AUTH_SECRET` random 32+ chars
- `REDIRECT_URL` + `APP_URL` เป็น production domain
- `uploads/` เป็น persistent volume

## Documentation

- `docs/phasing-plan.md` — Phase 1/2 scope
- `docs/route-map.md` — App Router routes
- `docs/data-model.md` — Prisma schema
- `docs/auth-rbac.md` — Authentication + RBAC
- `docs/ReserchTool-api/00-research-tool-detail.md` — API credentials (source of truth)
- `docs/knowledge/` — implementation deep-dives + HTML visualizations

## License

Internal use only — คณะพยาบาลศาสตร์ มหาวิทยาลัยเชียงใหม่
