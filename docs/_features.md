# Feature Tracker

---

## Phase 1 — Foundation

- [ ] **F1** Database schema + Prisma models + Docker Compose + seed script *(Profile with thesis fields, Document model, DocumentStatus enum, ActivityAction for documents)*
- [ ] **F2** CMU OAuth 2.0 login flow: redirect to Microsoft Azure AD → receive code → exchange token → call CMU MIS API → create/update Profile + UserRole → session → redirect by role
- [ ] **F3** Route protection + RBAC: `proxy.ts` redirect by role (STUDENT → `/dashboard`, ADMIN → `/admin/dashboard`), unauthorized → landing page, AlumAcc → `/unauthorized`
- [ ] **F4** Layout shell: root layout, public layout, student layout (orange sidebar), admin layout (purple sidebar with search button on navbar)
- [ ] **F5** Design tokens + theme system (orange student / purple admin)

## Phase 2 — Student Portal

- [ ] **F6** Student Dashboard: profile info (from MIS API) + thesis info + upload form + document list with status badges
- [ ] **F7** Document upload: PDF upload with title input, save to `uploads/{studentId}/`, create Document record
- [ ] **F8** Document management: view own documents with status, remove own PENDING documents

## Phase 3 — Admin Portal

- [ ] **F9** Admin Dashboard: 4 stat cards (นักศึกษาทั้งหมด, เอกสารทั้งหมด, รอตรวจสอบ, อนุมัติแล้ว) + recent activity feed
- [ ] **F10** Document management: list all documents, filter by status (ทั้งหมด/รอตรวจสอบ/อนุมัติแล้ว/ปฏิเสธแล้ว), approve single, approve all (PENDING only), reject with notes, remove, view PDF
- [ ] **F11** Student list: รายชื่อนักศึกษา + สถานะ (กำลังศึกษา/ลาออก/พ้นสภาพ) + จำนวนเอกสาร
- [ ] **F12** Admin search: ค้นหาจากรหัสนักศึกษา / ชื่อ / ชื่อวิทยานิพนธ์ (search button on navbar)

## Phase 4 — System

- [ ] **F13** Activity log: comprehensive audit trail (document upload, approve, reject, remove, login)
- [ ] **F14** API `/api/my/documents`: นักศึกษาตรวจสอบสถานะเอกสารและเวลาที่ได้รับการอนุมัติ

## Phase 5 — Post-MVP

- [ ] **F15** Email notifications: ส่งอีเมลแจ้งเตือนเมื่ออนุมัติ/ปฏิเสธ (Nodemailer + SMTP)
- [ ] **F16** Student detail page: `/admin/students/[id]`
- [ ] **F17** Export data (Excel/CSV)
- [ ] **F18** Pagination

---

## Implementation Order (Vertical Slices)

1. **F1 + F5** — Schema + theme (parallel)
2. **F2** — CMU OAuth + MIS API integration
3. **F3 + F4** — Proxy + layouts
4. **F6 + F7 + F8** — Student portal (dashboard + upload + manage)
5. **F9** — Admin dashboard
6. **F10** — Admin document management
7. **F11** — Admin student list
8. **F12** — Admin search
9. **F13** — Activity log
10. **F14** — Status check API
11. **F15-F18** — Post-MVP
