# Feature Tracker

---

## Phase 1 — Foundation

- [x] **F1** Database schema + Prisma models + Docker Compose + seed script *(Profile, Document model, DocumentStatus enum, ActivityAction for documents — thesis data NOT stored)*
- [x] **F2** CMU OAuth 2.0 login flow: redirect to Microsoft Azure AD → receive code → exchange token → call CMU MIS API → create/update Profile + UserRole → session → redirect by role
- [x] **F3** Route protection + RBAC: `proxy.ts` redirect by role (STUDENT → `/thesis`, ADMIN → `/admin/dashboard`), unauthorized → landing page, AlumAcc → `/unauthorized`
- [x] **F4** Layout shell: root layout, public layout, student layout (orange sidebar), admin layout (purple sidebar with search button on navbar)
- [x] **F5** Design tokens + theme system (orange student / purple admin)

## Phase 2 — Student Portal

- [x] **F6** Student Dashboard: profile info (from MIS API) + thesis info (from Thesis API, not stored in DB) + upload form + document list with status badges
- [x] **F7** Document upload: PDF upload with title input, save to `uploads/{studentId}/`, create Document record → send email to admin
- [x] **F8** Document management: view own documents with status, remove own PENDING documents, download PDF certificate for APPROVED documents

## Phase 3 — Admin Portal

- [x] **F9** Admin Dashboard: 4 stat cards (นักศึกษาทั้งหมด, เอกสารทั้งหมด, รอตรวจสอบ, อนุมัติแล้ว) + recent activity feed
- [x] **F10** Document management: list all documents with backend pagination, filter by status (ทั้งหมด/รอตรวจสอบ/อนุมัติแล้ว/ปฏิเสธแล้ว), stat cards (รอตรวจสอบ/อนุมัติแล้ว/เครื่องมือทั้งหมด), approve single, approve all (PENDING only), reject with notes → email to student, remove, view PDF
- [x] **F11** Student list: รายชื่อนักศึกษา + สถานะ (กำลังศึกษา/ลาออก/พ้นสภาพ) + จำนวนเอกสาร
- [x] **F12** Admin search: ค้นหาจากรหัสนักศึกษา / ชื่อ / ชื่อวิทยานิพนธ์ (search button on navbar)

## Phase 4 — System

- [x] **F13** Activity log: comprehensive audit trail (document upload, approve, reject, remove, login) with backend pagination + date filter
- [x] **F14** API `/api/my/documents`: นักศึกษาตรวจสอบสถานะเอกสารและเวลาที่ได้รับการอนุมัติ

## Phase 5 — Email + Download PDF

- [x] **F15** Email notifications: ส่งอีเมลแจ้งเตือนผ่าน CMU Email API (upload → แจ้งแอดมิน, approve/reject → แจ้งนักศึกษา)
- [x] **F16** Download PDF certificate: นักศึกษาดาวน์โหลดใบรับรองเมื่ออนุมัติแล้ว (ชื่อ, รหัส, รายการเครื่องมือ, วันที่) — ใช้ Sarabun font สำหรับภาษาไทย

## Phase 6 — Post-MVP

- [x] **F17** Student detail page: `/admin/students/[id]`
- [x] **F18** Export data (Excel/CSV)
- [ ] **F19** OCR ช่วยเจ้าหน้าที่
- [x] **F20-A** ระบบยืมเครื่องมือวิจัย (ไม่มี OCR): Instrument catalog (auto-create from approved Documents) + BorrowingRecord + Student borrow page + Admin borrowing management + status flow (PENDING → APPROVED/REJECTED) + license PDF upload/download
- [x] **F20-B** Typhoon OCR integration: OCR อ่านใบอนุญาตแล้วกรอกข้อมูลอัตโนมัติ (ชื่อผู้ขอ, วันที่ขอ, รายละเอียดเพิ่มเติม)

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
11. **F15** — Email notifications (CMU Email API)
12. **F16** — Download PDF certificate
13. **F17-F20** — Post-MVP
14. **F20-A** — Borrowing system (without OCR)
