# Product Requirements Document

## Project Name

FON Research Tool — ระบบจัดการเอกสารเครื่องมือวิจัย

## 1. Problem

คณะพยาบาลศาสตร์ มหาวิทยาลัยเชียงใหม่ ต้องเก็บข้อมูลเครื่องมือวิจัยที่นักศึกษาใช้ในการทำวิทยานิพนธ์ ปัจจุบันใช้ระบบเก่า (ASP.NET Web Forms) ที่ต้องการพัฒนาใหม่ด้วยเทคโนโลยีสมัยใหม่

## 2. Solution

เว็บแอปพลิเคชันที่:
- **นักศึกษา** ล็อกอินด้วย CMU Account กรอกชื่อเครื่องมือวิจัยและอัปโหลดเอกสาร PDF ทิ้งไว้
- **เจ้าหน้าที่** ตรวจสอบและอนุมัติเอกสาร พร้อมดู Dashboard สรุปข้อมูล

## 3. Technical Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| UI | React 19, Tailwind CSS v4, shadcn/ui |
| Auth | CMU Microsoft Azure AD OAuth 2.0 |
| Database | PostgreSQL |
| ORM | Prisma 7 |
| File Storage | Local filesystem (`uploads/`) |
| Email (Post-MVP) | Nodemailer + SMTP |

### Architecture Split

ระบบดึงข้อมูลส่วนตัวและวิทยานิพนธ์จาก CMU MIS API ทั้งหมด ยกเว้น 2 ฟิลด์ที่นักศึกษากรอกเอง: ชื่อเครื่องมือวิจัย + อัปโหลด PDF

## 4. User Roles

| Role | Description |
|---|---|
| **Student (นักศึกษา)** | ล็อกอินด้วย CMU Account, อัปโหลดเอกสารเครื่องมือวิจัย, ดูสถานะ |
| **Admin (เจ้าหน้าที่)** | ล็อกอินด้วย CMU Account, อนุมัติ/ปฏิเสธเอกสาร, ดู Dashboard |

ระบบแยกบทบาทจากประเภทบัญชี CMU (`StdAcc` = Student, `MISEmpAcc` = Admin)

## 5. Design System

| Context | Primary Color | Purpose |
|---|---|---|
| Student UI | Orange `#f26e2c` | หน้าจัดการเอกสารของนักศึกษา |
| Admin UI | Purple `#aa74ab` | หน้า Dashboard และจัดการเอกสาร |
| Shared | Slate base, system fonts | Neutral foundation |

## 6. Core Features (MVP)

### 6.1 Authentication
- CMU Microsoft Azure AD OAuth 2.0
- ดึงข้อมูลส่วนตัว + วิทยานิพนธ์จาก CMU MIS API อัตโนมัติ
- Role-based redirect (Student → `/dashboard`, Admin → `/admin/dashboard`)

### 6.2 Student Portal
- **Dashboard** (`/dashboard`) — ข้อมูลส่วนตัว + วิทยานิพนธ์ + อัปโหลดเอกสาร + รายการเอกสาร
- อัปโหลด PDF พร้อมกรอกชื่อเครื่องมือวิจัย
- ดูสถานะเอกสาร (รอตรวจสอบ / อนุมัติแล้ว / ปฏิเสธแล้ว)
- ลบเอกสารของตัวเอง (เฉพาะ PENDING)

### 6.3 Admin Portal
- **Dashboard** (`/admin/dashboard`) — 4 stat cards + กิจกรรมล่าสุด
- **Documents** (`/admin/documents`) — รายการเอกสารทั้งหมด, กรองสถานะ, อนุมัติ/ปฏิเสธ/ลบ
- **Students** (`/admin/students`) — รายชื่อนักศึกษา + สถานะ (กำลังศึกษา/ลาออก/พ้นสภาพ)
- **Activity Log** (`/admin/activity-log`) — บันทึกกิจกรรม

### 6.4 Document Lifecycle
- นักศึกษาอัปโหลด → `PENDING`
- แอดมินอนุมัติ (ทีละฉบับหรือ "อนุมัติทั้งหมด") → `APPROVED`
- แอดมินปฏิเสธพร้อมเหตุผล → `REJECTED`
- Bulk approve กระทบเฉพาะ PENDING เท่านั้น

## 7. Post-MVP

- ส่งอีเมลแจ้งเตือนเมื่ออนุมัติ/ปฏิเสธ
- หน้ารายละเอียดนักศึกษา `/admin/students/[id]`
- Export ข้อมูล (Excel/CSV)
- Pagination
