# Product Requirements Document

## Project Name

FON Research Tool — ระบบจัดการเอกสารเครื่องมือวิจัย

## 1. Problem

คณะพยาบาลศาสตร์ มหาวิทยาลัยเชียงใหม่ ต้องเก็บข้อมูลเครื่องมือวิจัยที่นักศึกษาใช้ในการทำวิทยานิพนธ์ ปัจจุบันใช้ระบบเก่า (ASP.NET Web Forms) ที่ต้องการพัฒนาใหม่ด้วยเทคโนโลยีสมัยใหม่

## 2. Solution

เว็บแอปพลิเคชันที่:
- **นักศึกษา** ล็อกอินด้วย CMU Account อัปโหลดเอกสารเครื่องมือวิจัย (PDF) + กรอกชื่อเครื่องมือ เมื่อ Submit ส่งอีเมลแจ้งแอดมิน
- **เจ้าหน้าที่** ตรวจสอบและอนุมัติ/ปฏิเสธเอกสาร ส่งอีเมลแจ้งนักศึกษา พร้อมดู Dashboard

## 3. Technical Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| UI | React 19, Tailwind CSS v4, shadcn/ui |
| Auth | CMU Microsoft Azure AD OAuth 2.0 |
| Database | PostgreSQL |
| ORM | Prisma 7 |
| File Storage | Local filesystem (`uploads/`) |
| Email | Email API (nurse.cmu.ac.th) |
| Thesis Data | Thesis API (mis.nurse.cmu.ac.th) |

### Data Sources

| ข้อมูล | แหล่งที่มา | เก็บใน DB? |
|---|---|---|
| ชื่อ, อีเมล, รหัสนักศึกษา | CMU Login (OAuth) | Yes — Profile |
| ภาควิชา, ระดับ, หลักสูตร, ชื่อ thesis | Thesis API | No ❌ — ดึงแสดงผลเฉยๆ |
| ชื่อเครื่องมือ + PDF | นักศึกษากรอก/อัปโหลด | Yes — Document |

## 4. User Roles

| Role | Description |
|---|---|
| **Student (นักศึกษา)** | StdAcc — ล็อกอินด้วย CMU Account, อัปโหลดเอกสาร, ดูสถานะ |
| **Admin (เจ้าหน้าที่)** | MISEmpAcc — ล็อกอินด้วย CMU Account, อนุมัติ/ปฏิเสธ, ดู Dashboard |

## 5. Design System

| Context | Primary Color | Purpose |
|---|---|---|
| Student UI | Orange `#f26e2c` | หน้าจัดการเอกสารของนักศึกษา |
| Admin UI | Purple `#aa74ab` | หน้า Dashboard และจัดการเอกสาร |
| Shared | Slate base, system fonts | Neutral foundation |

## 6. Core Features

### 6.1 Authentication
- CMU Microsoft Azure AD OAuth 2.0
- ดึงข้อมูลส่วนตัวจาก CMU Basic Info API อัตโนมัติ
- Role-based redirect (Student → `/dashboard`, Admin → `/admin/dashboard`)

### 6.2 Student Portal
- **Dashboard** (`/dashboard`) — ข้อมูลส่วนตัว + ข้อมูลวิทยานิพนธ์ (จาก Thesis API) + อัปโหลดเอกสาร + รายการเอกสาร
- Submit เอกสาร → ส่งอีเมลแจ้งแอดมิน (`supapan.ch@cmu.ac.th` cc `ampika.s@cmu.ac.th`)
- ดูสถานะเอกสาร (รอตรวจสอบ / อนุมัติแล้ว / ปฏิเสธแล้ว)
- ลบเอกสารของตัวเอง (เฉพาะ PENDING)
- Download PDF ใบรับรองเมื่ออนุมัติแล้ว (ชื่อ, รหัส, รายการเครื่องมือ, วันที่)

### 6.3 Admin Portal
- **Dashboard** (`/admin/dashboard`) — 4 stat cards + กิจกรรมล่าสุด
- **Documents** (`/admin/documents`) — Card สถิติด้านบน + ตาราง Backend Pagination + Filter สถานะ + อนุมัติ/ปฏิเสธ/ลบ + "อนุมัติทั้งหมด"
- **Students** (`/admin/students`) — รายชื่อนักศึกษา + จำนวนเอกสาร + ค้นหา
- **Activity Log** (`/admin/activity-log`) — Backend Pagination + Date Filter
- **ค้นหา** — ชื่อเครื่องมือ, ชื่อนักศึกษา, รหัสนักศึกษา, ชื่อวิทยานิพนธ์

### 6.4 Document Lifecycle
- นักศึกษา Submit → `PENDING` → ส่งอีเมลแจ้งแอดมิน
- แอดมินอนุมัติ (ทีละฉบับหรือ "อนุมัติทั้งหมด") → `APPROVED` → ส่งอีเมลแจ้งนักศึกษา
- แอดมินปฏิเสธพร้อมเหตุผล → `REJECTED` → ส่งอีเมลแจ้งนักศึกษา
- Bulk approve กระทบเฉพาะ PENDING เท่านั้น

### 6.5 Email Notifications
- ใช้ Email API: `POST https://mis.nurse.cmu.ac.th/thesis/EmailApi/SendEmail`
- อีเมลผู้ส่ง: `no-reply-ResearchTool@cmu.ac.th`
- Token อายุ 24 ชั่วโมง → ขอใหม่เมื่อหมดอายุ

### 6.6 API — นักศึกษาตรวจสอบสถานะ
- `GET /api/my/documents` — ดูรายการเอกสาร + สถานะ + เวลาอนุมัติ

## 7. Post-MVP

- ฟีเจอร์เก็บประวัติการนำไปใช้ประโยชน์ของเครื่องมือ
- OCR ช่วยเจ้าหน้าที่
- Export ข้อมูล (Excel/CSV)
