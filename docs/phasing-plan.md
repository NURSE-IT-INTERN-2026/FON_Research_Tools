# Phasing Plan

เอกสารฉบับนี้แยกแผนการทำงานเป็น 2 Phase

---

## Phase 1 — ทำเลย (มี API แล้ว)

CMU OAuth + Thesis API + Document Management + Email

### 1. Auth — CMU OAuth 2.0
- Login → redirect to Microsoft Azure AD → callback → create session
- ดึงข้อมูลส่วนตัวจาก CMU Basic Info API (name, email, studentId)
- Role กำหนดจาก `itaccount_type_id`: StdAcc → STUDENT, MISEmpAcc → ADMIN

### 2. Thesis Data — ดึงจาก Thesis API แสดงผล
- `POST https://mis.nurse.cmu.ac.th/thesis/student/GetDataThesis?student_id={id}`
- แสดง: title_th, title_en, major_th, level_name_th, curriculum
- **ไม่เก็บใน DB** — ดึงจาก API ทุกครั้งที่แสดงผล

### 3. Document Management
- Student: upload PDF + กรอกชื่อเครื่องมือ → PENDING
- Submit → ส่งอีเมลแจ้งแอดมิน (ผ่าน Email API)
- Admin: approve/reject/bulk approve → ส่งอีเมลแจ้งนักศึกษา
- Student: Download PDF ใบรับรองเมื่ออนุมัติแล้ว

### 4. Feature Checklist

**Student Portal:**
- [ ] CMU OAuth login
- [ ] Student Dashboard: profile + thesis info (from API) + upload + document list
- [ ] Upload PDF + ชื่อเครื่องมือ → PENDING + ส่งอีเมลแจ้งแอดมิน
- [ ] ดูสถานะเอกสาร
- [ ] ลบเอกสาร (PENDING เท่านั้น)
- [ ] Download PDF ใบรับรอง (APPROVED เท่านั้น)

**Admin Portal:**
- [ ] Dashboard: 4 stat cards + กิจกรรมล่าสุด
- [ ] Documents: Card สถิติ + ตาราง (Backend Pagination) + Filter สถานะ
- [ ] Approve (single / bulk PENDING) → ส่งอีเมลแจ้งนักศึกษา
- [ ] Reject + เหตุผล → ส่งอีเมลแจ้งนักศึกษา
- [ ] ดู/เปิด PDF ตรวจสอบ
- [ ] ลบเอกสาร
- [ ] Students: รายชื่อ + จำนวนเอกสาร
- [ ] ค้นหา: ชื่อเครื่องมือ, ชื่อนักศึกษา, รหัส, ชื่อ thesis
- [ ] Activity Log + Backend Pagination + Date Filter

**API:**
- [ ] `GET /api/my/documents` — นักศึกษาตรวจสอบสถานะ + เวลาอนุมัติ

---

## Phase 2 — Post-MVP

- ฟีเจอร์เก็บประวัติการนำไปใช้ประโยชน์ของเครื่องมือ
- OCR ช่วยเจ้าหน้าที่
- Export ข้อมูล (Excel/CSV)

---

## API Credentials

ดูรายละเอียดที่ `docs/ReserchTool-api/00-research-tool-detail.md`

| API | URL | Credentials |
|---|---|---|
| CMU OAuth Token | `login.microsoftonline.com/{tenant}/oauth2/v2.0/token` | CLIENT_ID + CLIENT_SECRET in env |
| CMU Basic Info | `api.cmu.ac.th/mis/cmuaccount/prod/v3/me/basicinfo` | Bearer token from OAuth |
| Thesis API | `mis.nurse.cmu.ac.th/thesis/student/GetDataThesis` | Bearer token (static) |
| Email GetToken | `mis.nurse.cmu.ac.th/thesis/EmailApi/GetToken` | client_id + client_secret |
| Email SendEmail | `mis.nurse.cmu.ac.th/thesis/EmailApi/SendEmail` | Bearer token from GetToken |
