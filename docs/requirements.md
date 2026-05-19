# Requirements Document — FON Research Tool

> คณะพยาบาลศาสตร์ มหาวิทยาลัยเชียงใหม่
> ระบบจัดการเอกสารเครื่องมือวิจัย (Research Tool Document Management)

---

## 1. ภาพรวมระบบ

ระบบสำหรับเก็บข้อมูลการใช้เครื่องมือวิจัยของนักศึกษา นักศึกษากรอกชื่อเครื่องมือวิจัยที่จะใช้ในการทำวิทยานิพนธ์ อัปโหลดเอกสาร PDF เจ้าหน้าที่ตรวจสอบและอนุมัติ/ปฏิเสธ เมื่ออนุมัติแล้วระบบส่งแจ้งเตือนไปที่อีเมลนักศึกษา และแสดงข้อมูลบน Dashboard ของเจ้าหน้าที่

---

## 2. ผู้ใช้งาน (User Roles)

### 2.1 นักศึกษา (Student) — `StdAcc`

**Authentication:**
- ล็อกอินผ่าน CMU Microsoft Azure AD OAuth 2.0
- ระบบดึงข้อมูลส่วนตัวและวิทยานิพนธ์จาก CMU MIS API อัตโนมัติหลังล็อกอิน

**ข้อมูลที่ดึงจาก CMU MIS API (อัตโนมัติ):**
- ชื่อ-นามสกุล, CMU IT Account, อีเมล
- รหัสนักศึกษา
- ภาควิชา, ระดับปริญญา, หลักสูตร
- ชื่อวิทยานิพนธ์ (ไทย/อังกฤษ), บทคัดย่อ

**ฟังก์ชันการทำงาน:**
- ดูข้อมูลส่วนตัวและวิทยานิพนธ์ของตัวเอง
- อัปโหลดเอกสารเครื่องมือวิจัย (PDF) พร้อมกรอกชื่อเครื่องมือ
- ดูรายการเอกสารที่อัปโหลดพร้อมสถานะ
- ลบเอกสารของตัวเอง (เฉพาะสถานะ รอตรวจสอบ)
- รับการแจ้งเตือนทางอีเมลเมื่อเอกสารได้รับการอนุมัติ/ปฏิเสธ
- ออกจากระบบ

### 2.2 เจ้าหน้าที่/อาจารย์ (Admin) — `MISEmpAcc`

**Authentication:**
- ล็อกอินผ่าน CMU Microsoft Azure AD OAuth 2.0
- ระบบตรวจสอบสิทธิ์จากประเภทบัญชี `MISEmpAcc`

**ฟังก์ชันการทำงาน:**
- ดู Dashboard: สถิติภาพรวม + กิจกรรมล่าสุด
- ดูรายการเอกสารทั้งหมด พร้อมกรองตามสถานะ (ทั้งหมด / รอตรวจสอบ / อนุมัติแล้ว / ปฏิเสธแล้ว)
- อนุมัติเอกสาร → สถานะเปลี่ยนเป็น "อนุมัติแล้ว" + ส่งอีเมลแจ้งนักศึกษา
- ปฏิเสธเอกสารพร้อมระบุเหตุผล → สถานะเปลี่ยนเป็น "ปฏิเสธแล้ว" + ส่งอีเมลแจ้งนักศึกษา
- ดู/เปิดไฟล์ PDF ที่นักศึกษาอัปโหลด
- ลบเอกสารได้ทุกฉบับ
- ดูรายชื่อนักศึกษาทั้งหมดพร้อมจำนวนเอกสาร
- ดูรายละเอียดของนักศึกษาแต่ละคน (ข้อมูลส่วนตัว + วิทยานิพนธ์ + เอกสาร)
- ดูบันทึกกิจกรรม (Activity Log)
- ออกจากระบบ

---

## 3. Authentication — CMU OAuth 2.0

### 3.1 ขั้นตอนการล็อกอิน

```
ผู้ใช้กด Login
    → Redirect ไป Microsoft Azure AD OAuth 2.0
        → กรอก CMU IT Account + Password
            → รับ Authorization Code กลับมา
                → แลก Code เป็น Access Token
                    → เรียก CMU MIS API (/v3/me/basicinfo) ดึงข้อมูลผู้ใช้
                        → บันทึก/อัปเดตข้อมูลในระบบ
                            → Redirect ตามบทบาท
```

### 3.2 การเปลี่ยนเส้นทางหลังล็อกอิน

| ประเภทบัญชี (`itaccount_type_id`) | เปลี่ยนเส้นทางไป | หมายเหตุ |
|---|---|---|
| `StdAcc` (นักศึกษา) | `/dashboard` | หน้าจัดการเอกสารของตัวเอง |
| `MISEmpAcc` (เจ้าหน้าที่) | `/admin/dashboard` | หน้า Dashboard แอดมิน |
| `AlumAcc` (ศิษย์เก่า) | แจ้งไม่มีสิทธิ์เข้าถึง | ระบบไม่รองรับศิษย์เก่า |

### 3.3 ข้อมูลที่ดึงจาก OAuth + CMU MIS API

| ข้อมูล | แหล่งที่มา | ใช้สำหรับ |
|---|---|---|
| ชื่อ-นามสกุล | CMU MIS API | Profile.name |
| CMU IT Account | OAuth Token | ระบุตัวตน |
| อีเมล | CMU MIS API | Profile.email |
| ประเภทบัญชี | CMU MIS API | กำหนดบทบาท (Student/Admin) |
| รหัสนักศึกษา | CMU MIS API | Profile.studentId |

### 3.4 ข้อมูลวิทยานิพนธ์ที่ดึงจาก CMU MIS API

| ข้อมูล | API Endpoint | ใช้สำหรับ |
|---|---|---|
| ชื่อวิทยานิพนธ์ (ไทย) | StudentThesisProfile | Profile.thesisTitleTh |
| ชื่อวิทยานิพนธ์ (อังกฤษ) | StudentThesisProfile | Profile.thesisTitleEn |
| ระดับปริญญา | StudentThesisProfile | Profile.degree |
| หลักสูตร | StudentThesisProfile | Profile.program |
| ภาควิชา | StudentThesisProfile | Profile.department |
| บทคัดย่อ (ไทย/อังกฤษ) | StudentThesisProfile | แสดงบนหน้ารายละเอียด |

### 3.5 Session Management
- Session timeout: 8 ชั่วโมง (480 นาที)
- ข้อมูล Session เก็บใน HTTP-only cookie
- ทุกหน้าตรวจสอบ Session ก่อน render

---

## 4. ข้อมูลที่เก็บในระบบ

### 4.1 ข้อมูลนักศึกษา (Profile)

| ฟิลด์ | ประเภท | คำอธิบาย | แหล่งที่มา |
|---|---|---|---|
| id | String (UUID) | Primary Key (จาก CMU Account ID หรือ auto-generate) | ระบบ |
| name | String | ชื่อ-นามสกุล | CMU MIS API |
| email | String (unique) | อีเมล | CMU MIS API |
| studentId | String (unique, nullable) | รหัสนักศึกษา | CMU MIS API |
| department | String (nullable) | ภาควิชา | CMU MIS API |
| degree | String (nullable) | ระดับปริญญา (ป.ตรี, ป.โท, ป.เอก) | CMU MIS API |
| program | String (nullable) | หลักสูตร | CMU MIS API |
| thesisTitleTh | String (nullable) | ชื่อวิทยานิพนธ์ (ไทย) | CMU MIS API |
| thesisTitleEn | String (nullable) | ชื่อวิทยานิพนธ์ (อังกฤษ) | CMU MIS API |
| accountType | String | ประเภทบัญชี (`StdAcc`, `MISEmpAcc`) | CMU MIS API |
| cmuItAccount | String | CMU IT Account Username | OAuth |
| createdAt | DateTime | วันที่สร้าง | Auto |
| updatedAt | DateTime | วันที่แก้ไขล่าสุด | Auto |

### 4.2 เอกสารเครื่องมือวิจัย (Document)

| ฟิลด์ | ประเภท | คำอธิบาย |
|---|---|---|
| id | String (CUID) | Primary Key |
| userId | String (FK → Profile) | เจ้าของเอกสาร |
| title | String | ชื่อเครื่องมือวิจัย |
| fileName | String | ชื่อไฟล์ที่จัดเก็บบนเซิร์ฟเวอร์ |
| originalName | String | ชื่อไฟล์ต้นฉบับที่อัปโหลด |
| fileSize | Int | ขนาดไฟล์ (bytes) |
| status | Enum: DocumentStatus | สถานะเอกสาร |
| approvedBy | String (nullable) | อีเมลผู้อนุมัติ |
| adminNotes | String (nullable) | หมายเหตุ (กรณีปฏิเสธ/หมายเหตุแอดมิน) |
| createdAt | DateTime | วันที่อัปโหลด |
| updatedAt | DateTime | วันที่แก้ไขล่าสุด (อนุมัติ/ปฏิเสธ) |

### 4.3 สถานะเอกสาร (DocumentStatus)

| ค่า Enum | Thai Label | สี Badge | คำอธิบาย |
|---|---|---|---|
| `PENDING` | รอตรวจสอบ | เหลือง/ส้ม | เอกสารใหม่ รอแอดมินตรวจสอบ |
| `APPROVED` | อนุมัติแล้ว | เขียว | แอดมินอนุมัติเอกสารแล้ว |
| `REJECTED` | ปฏิเสธแล้ว | แดง | แอดมินปฏิเสธพร้อมเหตุผล |

### 4.4 Status Flow

```
  ┌────────────┐
  │  อัปโหลด    │
  │  เอกสาร    │
  └─────┬──────┘
        │
        ▼
  ┌────────────┐    Approve    ┌─────────────────┐
  │  PENDING   │──────────────→│    APPROVED      │
  │ รอตรวจสอบ  │               │  อนุมัติแล้ว      │
  └─────┬──────┘               └─────────────────┘
        │                              │
        │    Reject                     │ ส่งอีเมลแจ้งเตือน
        ▼                              ▼
  ┌────────────┐               ┌─────────────────┐
  │  REJECTED  │               │  แจ้งเตือนอีเมล   │
  │ ปฏิเสธแล้ว  │               │  นักศึกษา         │
  └────────────┘               └─────────────────┘
```

---

## 5. ข้อจำกัดการอัปโหลด

| รายการ | ค่า |
|---|---|
| ประเภทไฟล์ที่รองรับ | PDF เท่านั้น |
| ขนาดไฟล์สูงสุด | 100 MB ต่อไฟล์ |
| จำนวนไฟล์ | ไม่จำกัด (นักศึกษาอัปโหลดได้หลายเอกสาร) |
| รูปแบบชื่อไฟล์บนเซิร์ฟเวอร์ | `{studentId}_{ลำดับ}.pdf` |
| ตำแหน่งจัดเก็บ | `uploads/{studentId}/` |

---

## 6. หน้าเว็บ (Pages)

### 6.1 Public Pages

| Route | หน้า | คำอธิบาย |
|---|---|---|
| `/` | Landing Page | หน้าแรก มีปุ่มเข้าสู่ระบบ |
| `/login` | Login | Redirect ไป CMU OAuth 2.0 (ไม่มี form) |
| `/api/auth/callback` | OAuth Callback | รับ Authorization Code จาก Microsoft |
| `/unauthorized` | Unauthorized | แจ้งไม่มีสิทธิ์เข้าถึง (สำหรับ AlumAcc) |

### 6.2 Student Pages (Orange theme)

| Route | หน้า | คำอธิบาย |
|---|---|---|
| `/dashboard` | Student Dashboard | แสดงข้อมูลส่วนตัว + วิทยานิพนธ์ + อัปโหลดเอกสาร + รายการเอกสาร |

**รายละเอียดหน้า `/dashboard`:**
- **ส่วนที่ 1: ข้อมูลส่วนตัว** — ชื่อ, รหัสนักศึกษา, ภาควิชา, ระดับปริญญา, หลักสูตร
- **ส่วนที่ 2: ข้อมูลวิทยานิพนธ์** — ชื่อวิทยานิพนธ์ (ไทย/อังกฤษ), บทคัดย่อ
- **ส่วนที่ 3: อัปโหลดเอกสาร** — ฟอร์ม: ชื่อเครื่องมือวิจัย + เลือกไฟล์ PDF + ปุ่ม Upload
- **ส่วนที่ 4: รายการเอกสาร** — ตารางแสดงเอกสารทั้งหมดพร้อมสถานะ มีปุ่มลบ (เฉพาะ PENDING)

### 6.3 Admin Pages (Purple theme)

| Route | หน้า | คำอธิบาย |
|---|---|---|
| `/admin/dashboard` | Admin Dashboard | Stat cards + กิจกรรมล่าสุด |
| `/admin/documents` | Documents | รายการเอกสารทั้งหมด พร้อมกรอง/อนุมัติ/ปฏิเสธ |
| `/admin/students` | Students | รายชื่อนักศึกษาพร้อมจำนวนเอกสาร |
| `/admin/students/[id]` | Student Detail | ข้อมูลนักศึกษา + วิทยานิพนธ์ + เอกสารทั้งหมดของนักศึกษาคนนั้น |
| `/admin/activity-log` | Activity Log | บันทึกกิจกรรมทั้งหมด |

**รายละเอียดหน้า `/admin/dashboard`:**
- 4 Stat Cards:
  - จำนวนนักศึกษาทั้งหมด → link to `/admin/students`
  - เอกสารทั้งหมด → link to `/admin/documents`
  - รอตรวจสอบ → link to `/admin/documents?status=PENDING`
  - อนุมัติแล้ว → link to `/admin/documents?status=APPROVED`
- กิจกรรมล่าสุด 10 รายการ

**รายละเอียดหน้า `/admin/documents`:**
- ตาราง: ลำดับ, ชื่อนักศึกษา, รหัสนักศึกษา, ชื่อเครื่องมือวิจัย, ไฟล์, สถานะ, วันที่อัปโหลด, การดำเนินการ
- Filter pills: ทั้งหมด / รอตรวจสอบ / อนุมัติแล้ว / ปฏิเสธแล้ว
- Actions:
  - PENDING → อนุมัติ / ปฏิเสธ (พร้อมระบุเหตุผล)
  - ทุกสถานะ → ดู PDF / ลบ
  - ชื่อนักศึกษา → link to `/admin/students/[id]`

---

## 7. API Endpoints

### 7.1 Application APIs (Next.js API Routes)

| Method | Path | คำอธิบาย | Auth |
|---|---|---|---|
| GET | `/api/auth/callback` | OAuth callback — รับ code, แลก token, ดึงข้อมูล, สร้าง session, redirect | Public |
| POST | `/api/auth/logout` | ล้าง session และ redirect | Any |
| POST | `/api/documents` | อัปโหลดเอกสารใหม่ (multipart/form-data) | Student |
| GET | `/api/documents/[id]/file` | ดึง/เปิดไฟล์ PDF | Student (ของตัวเอง) / Admin |
| DELETE | `/api/documents/[id]` | ลบเอกสาร | Student (ของตัวเอง, PENDING เท่านั้น) / Admin (ทุกสถานะ) |
| PATCH | `/api/documents/[id]/approve` | อนุมัติเอกสาร | Admin |
| PATCH | `/api/documents/[id]/reject` | ปฏิเสธเอกสาร (body: { notes }) | Admin |

### 7.2 สถานะเอกสาร API (ใหม่)

API สำหรับนักศึกษาตรวจสอบสถานะเอกสารและเวลาที่ได้รับการอนุมัติ

| Method | Path | คำอธิบาย | Auth |
|---|---|---|---|
| GET | `/api/my/documents` | ดูรายการเอกสารของตัวเอง พร้อมสถานะและเวลาอนุมัติ | Student |

**Response format:**

```json
{
  "documents": [
    {
      "id": "doc_abc123",
      "title": "The Positive Discipline Questionnaire",
      "status": "APPROVED",
      "statusLabel": "อนุมัติแล้ว",
      "fileName": "631251001_1.pdf",
      "originalName": "questionnaire_v2.pdf",
      "fileSize": 245678,
      "createdAt": "2026-04-30T14:57:44.247Z",
      "updatedAt": "2026-05-01T13:18:10.407Z",
      "approvedBy": "supapan.ch@cmu.ac.th",
      "approvedAt": "2026-05-01T13:18:10.407Z",
      "adminNotes": null,
      "rejectionReason": null
    },
    {
      "id": "doc_def456",
      "title": "The Nurturing Care Questionnaire",
      "status": "REJECTED",
      "statusLabel": "ปฏิเสธแล้ว",
      "fileName": "631251001_2.pdf",
      "originalName": "nurturing_care.pdf",
      "fileSize": 189234,
      "createdAt": "2026-04-30T15:00:00.000Z",
      "updatedAt": "2026-05-02T09:30:00.000Z",
      "approvedBy": "supapan.ch@cmu.ac.th",
      "approvedAt": null,
      "adminNotes": "กรุณาแก้ไขหน้าปกให้ตรงตามรูปแบบที่กำหนด",
      "rejectionReason": "กรุณาแก้ไขหน้าปกให้ตรงตามรูปแบบที่กำหนด"
    },
    {
      "id": "doc_ghi789",
      "title": "Instruments for qualitative data collection",
      "status": "PENDING",
      "statusLabel": "รอตรวจสอบ",
      "fileName": "631251001_3.pdf",
      "originalName": "qualitative_tools.pdf",
      "fileSize": 312456,
      "createdAt": "2026-05-10T10:00:00.000Z",
      "updatedAt": "2026-05-10T10:00:00.000Z",
      "approvedBy": null,
      "approvedAt": null,
      "adminNotes": null,
      "rejectionReason": null
    }
  ],
  "summary": {
    "total": 3,
    "pending": 1,
    "approved": 1,
    "rejected": 1
  }
}
```

**ฟิลด์สำคัญสำหรับการตรวจสอบเวลาอนุมัติ:**
- `status` — สถานะปัจจุบัน (`PENDING` / `APPROVED` / `REJECTED`)
- `approvedAt` — วันเวลาที่ได้รับการอนุมัติ/ปฏิเสธ (ค่าเดียวกับ `updatedAt` เมื่อสถานะเปลี่ยน)
- `approvedBy` — อีเมลผู้อนุมัติ/ปฏิเสธ
- `rejectionReason` — เหตุผลการปฏิเสธ (มีค่าเฉพาะสถานะ `REJECTED`)

### 7.3 External APIs (ที่ระบบเรียกใช้)

| API | URL | วัตถุประสงค์ |
|---|---|---|
| Microsoft Azure AD OAuth | `https://login.microsoftonline.com/{tenant-id}/oauth2/v2.0/authorize` | Authorization |
| Microsoft Token Endpoint | `https://login.microsoftonline.com/{tenant-id}/oauth2/v2.0/token` | แลก Code → Access Token |
| CMU MIS User Profile | `https://mis.cmu.ac.th/mis/cmuaccount/prod/v3/me/basicinfo` | ดึงข้อมูลผู้ใช้ |
| CMU MIS Student Thesis | `http://mis.nurse.cmu.ac.th/api/StudentThesisProfile.aspx` | ดึงข้อมูลวิทยานิพนธ์ |

---

## 8. การแจ้งเตือนอีเมล

### 8.1 เงื่อนไขการส่งอีเมล

| เหตุการณ์ | ผู้รับ | เนื้อหา |
|---|---|---|
| แอดมินอนุมัติเอกสาร | นักศึกษา (เจ้าของเอกสาร) | แจ้งว่าเอกสาร "[ชื่อเครื่องมือ]" ได้รับการอนุมัติแล้ว พร้อมวันเวลาและชื่อผู้อนุมัติ |
| แอดมินปฏิเสธเอกสาร | นักศึกษา (เจ้าของเอกสาร) | แจ้งว่าเอกสาร "[ชื่อเครื่องมือ]" ถูกปฏิเสธ พร้อมเหตุผลและชื่อผู้พิจารณา |

### 8.2 รูปแบบอีเมล

**หัวข้ออีเมล (อนุมัติ):** `[FON Research Tool] เอกสารได้รับการอนุมัติ: {ชื่อเครื่องมือวิจัย}`

**หัวข้ออีเมล (ปฏิเสธ):** `[FON Research Tool] เอกสารถูกปฏิเสธ: {ชื่อเครื่องมือวิจัย}`

---

## 9. บันทึกกิจกรรม (Activity Log)

### 9.1 Action Types

| Action | Thai Label | คำอธิบาย |
|---|---|---|
| `USER_LOGIN` | เข้าสู่ระบบ | ผู้ใช้ล็อกอิน |
| `DOCUMENT_UPLOAD` | อัปโหลดเอกสาร | นักศึกษาอัปโหลดเอกสารใหม่ |
| `DOCUMENT_APPROVE` | อนุมัติเอกสาร | แอดมินอนุมัติเอกสาร |
| `DOCUMENT_REJECT` | ปฏิเสธเอกสาร | แอดมินปฏิเสธเอกสาร |
| `DOCUMENT_REMOVE` | ลบเอกสาร | นักศึกษา/แอดมินลบเอกสาร |

### 9.2 ข้อมูลที่บันทึก

- ผู้กระทำ (userId + name)
- ประเภท action
- ป้ายกำกับ (targetLabel) เช่น "สมชาย → The Positive Discipline Questionnaire"
- วันเวลา

---

## 10. สิทธิ์การใช้งาน (RBAC Matrix)

| ฟังก์ชัน | นักศึกษา | แอดมิน |
|---|:---:|:---:|
| ล็อกอิน (CMU OAuth) | ✓ | ✓ |
| ดูข้อมูลส่วนตัว + วิทยานิพนธ์ | ✓ (ตัวเอง) | ✓ (ทุกคน) |
| อัปโหลดเอกสาร | ✓ | — |
| ดูเอกสารของตัวเอง | ✓ | — |
| ดูเอกสารทั้งหมด | — | ✓ |
| ลบเอกสาร (PENDING ของตัวเอง) | ✓ | — |
| ลบเอกสาร (ทุกฉบับ) | — | ✓ |
| อนุมัติ/ปฏิเสธเอกสาร | — | ✓ |
| ดู Dashboard | — | ✓ |
| ดูรายชื่อนักศึกษา | — | ✓ |
| ดู Activity Log | — | ✓ |
| รับอีเมลแจ้งเตือน | ✓ | — |
| เรียก API `/api/my/documents` | ✓ | — |
| ออกจากระบบ | ✓ | ✓ |

---

## 11. เทคโนโลยี

| ส่วนประกอบ | เทคโนโลยี |
|---|---|
| Framework | Next.js 16 (App Router) |
| UI | React 19, Tailwind CSS v4, shadcn/ui |
| Database | PostgreSQL |
| ORM | Prisma 7 |
| Auth | CMU Microsoft Azure AD OAuth 2.0 |
| File Storage | Local filesystem (`uploads/`) |
| Email (Post-MVP) | Nodemailer + SMTP |
| External API | CMU MIS API |

---

## 12. Phasing

### Phase 1 — MVP (ทำก่อน)
- [x] Foundation: Schema, Auth helpers, Layout shell, Theme
- [ ] CMU OAuth 2.0 login flow
- [ ] ดึงข้อมูลนักศึกษา + วิทยานิพนธ์จาก CMU MIS API
- [ ] Student Dashboard: ข้อมูลส่วนตัว + อัปโหลดเอกสาร + รายการเอกสาร
- [ ] Admin Dashboard: Stat cards + กิจกรรมล่าสุด
- [ ] Admin Documents: รายการเอกสาร + อนุมัติ/ปฏิเสธ/ลบ + กรองสถานะ
- [ ] Admin Students: รายชื่อนักศึกษา
- [ ] Activity Log
- [ ] API `/api/my/documents` (สถานะเอกสาร + เวลาอนุมัติ)

### Phase 2 — Post-MVP (ทำทีหลัง)
- [ ] ส่งอีเมลแจ้งเตือนเมื่ออนุมัติ/ปฏิเสธ (Nodemailer + SMTP)
- [ ] หน้ารายละเอียดนักศึกษา `/admin/students/[id]`
- [ ] ค้นหานักศึกษา/เอกสาร
- [ ] Export ข้อมูล (Excel/CSV)
- [ ] Pagination
