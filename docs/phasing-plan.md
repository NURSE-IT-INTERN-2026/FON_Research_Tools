# Phasing Plan — ก่อนได้ API / หลังได้ API

เอกสารฉบับนี้แยกแผนการทำงานเป็น 2 Phase ชัดเจน เพื่อให้ทำงานได้ทันทีโดยไม่ต้องรอ CMU API

---

## Phase 1 — ทำเลยตอนนี้ (ไม่ต้องรอ API)

ใช้ email/password auth + นักศึกษากรอกข้อมูลเอง + โครงสร้าง Feature ครบ

### 1. Auth
- ใช้ email/password เหมือนที่มีอยู่แล้ว (custom HMAC-SHA256 session)
- Role: STUDENT / ADMIN
- Signup form: ชื่อ, อีเมล, รหัสผ่าน, role (Student/Admin)
- ไม่มี CMU OAuth

### 2. ข้อมูลนักศึกษา — กรอกเอง
Signup form สำหรับ Student เพิ่มฟิลด์:
- รหัสนักศึกษา
- ภาควิชา
- ระดับปริญญา
- หลักสูตร
- ชื่อวิทยานิพนธ์ (ไทย)
- ชื่อวิทยานิพนธ์ (อังกฤษ)

### 3. Feature ที่ต้องทำ (ทั้งหมดทำได้เลย)

**Student Portal:**
- [x] สมัคร + ล็อกอิน (email/password)
- [ ] Student Dashboard: ข้อมูลส่วนตัว + วิทยานิพนธ์ + อัปโหลด PDF + รายการเอกสาร
- [ ] อัปโหลดเอกสารเครื่องมือวิจัย (PDF) พร้อมกรอกชื่อ
- [ ] ดูสถานะเอกสารตัวเอง
- [ ] ลบเอกสารของตัวเอง (PENDING เท่านั้น)

**Admin Portal:**
- [ ] Dashboard: 4 stat cards (นักศึกษาทั้งหมด, เอกสารทั้งหมด, รอตรวจสอบ, อนุมัติแล้ว) + กิจกรรมล่าสุด
- [ ] Documents: รายการเอกสารทั้งหมด + กรองสถานะ + อนุมัติ/ปฏิเสธ/ลบ
- [ ] "อนุมัติทั้งหมด" (PENDING เท่านั้น)
- [ ] Students: รายชื่อนักศึกษา + จำนวนเอกสาร
- [ ] ค้นหานักศึกษา (รหัส/ชื่อ/ชื่อ thesis)
- [ ] ดู/เปิด PDF
- [ ] Activity Log

**API:**
- [ ] `GET /api/my/documents` — นักศึกษาตรวจสอบสถานะเอกสาร + เวลาอนุมัติ

### 4. สิ่งที่ **ไม่มี** ใน Phase 1
- CMU OAuth 2.0 login
- ดึงข้อมูลอัตโนมัติจาก CMU MIS API
- สถานะนักศึกษา (กำลังศึกษา/ลาออก/พ้นสภาพ)
- อีเมลแจ้งเตือน

---

## Phase 2 — ทำหลังได้ API (เสียบทับ)

เมื่อได้ CMU API แล้ว เปลี่ยนแค่จุดที่เกี่ยวกับ auth และ data source โครงสร้าง UI/feature เหมือนเดิมทุกอย่าง

### 1. Auth: เปลี่ยนจาก email/password → CMU OAuth 2.0

| จุดที่เปลี่ยน | ก่อน (Phase 1) | หลัง (Phase 2) |
|---|---|---|
| Login page | email/password form | Redirect ไป CMU OAuth |
| Signup page | กรอกข้อมูลเอง | ไม่ต้อง signup — login แล้วได้ข้อมูลเลย |
| Session | email/password + HMAC token | OAuth code → token → session |
| Role กำหนดจาก | เลือกตอน signup | `itaccount_type_id` จาก MIS API |
| `/login` page | Form with email/password | Redirect to Microsoft Azure AD |
| `/signup` page | Registration form | ไม่ใช้แล้ว หรือเก็บไว้สำหรับ admin |

**ไฟล์ที่ต้องแก้:**
- `src/app/login/page.tsx` — เปลี่ยนจาก form → redirect
- `src/app/signup/page.tsx` — ลบ หรือเก็บสำหรับ admin
- `src/actions/login.ts` — เปลี่ยนจาก verify password → OAuth callback
- `src/actions/signup.ts` — ลบ หรือแก้
- เพิ่ม `src/app/api/auth/callback/route.ts` — OAuth handler
- `src/proxy.ts` — อัปเดต routes (ลบ `/signup`)

### 2. Data: เปลี่ยนจากกรอกเอง → ดึงจาก CMU MIS API

| จุดที่เปลี่ยน | ก่อน (Phase 1) | หลัง (Phase 2) |
|---|---|---|
| ข้อมูลส่วนตัว | กรอกตอน signup | ดึงอัตโนมัติจาก `/v3/me/basicinfo` |
| ข้อมูลวิทยานิพนธ์ | กรอกตอน signup | ดึงอัตโนมัติจาก `StudentThesisProfile` |
| สถานะนักศึกษา | ไม่มี | ดึงจาก MIS API + แสดง badge |

**ไฟล์ที่ต้องแก้:**
- `src/app/api/auth/callback/route.ts` — เพิ่ม MIS API calls
- `src/app/signup/page.tsx` — ลบฟิลด์ที่ไม่ต้องกรอกแล้ว
- Student Dashboard — แสดงสถานะนักศึกษาเพิ่ม
- Admin Students — แสดงสถานะ badge เพิ่ม

### 3. สิ่งที่ **ไม่ต้องแก้** (คงเดิม)
- Data model (Profile มีฟิลด์ครบอยู่แล้ว)
- UI / Component styling
- Document upload/download
- Document approve/reject/bulk approve
- Activity Log
- API `/api/my/documents`
- Sidebar, theme, layout
- Stat cards, filter pills, status badges
- Proxy route protection logic

---

## สรุป

```
Phase 1 (ทำเลยตอนนี้)
├── email/password auth
├── นักศึกษากรอกข้อมูลเอง
├── อัปโหลด/อนุมัติ/ปฏิเสธเอกสาร
├── Dashboard, Documents, Students
├── Activity Log
├── API /api/my/documents
└── คง UI เดิมทั้งหมด

Phase 2 (ทำทีหลังได้ API)
├── CMU OAuth 2.0 login
├── ดึงข้อมูลจาก CMU MIS API
├── สถานะนักศึกษา badge
└── อีเมลแจ้งเตือน (Nodemailer)
```
