# Data Model

PostgreSQL via Prisma 7. Auth managed by CMU OAuth 2.0; application data managed by Prisma.

---

## Enums

```prisma
enum AppRole {
  ADMIN
  STUDENT
}

enum DocumentStatus {
  PENDING
  APPROVED
  REJECTED
}

enum ActivityAction {
  USER_LOGIN
  DOCUMENT_UPLOAD
  DOCUMENT_APPROVE
  DOCUMENT_REJECT
  DOCUMENT_REMOVE
  ADMIN_CREATED
}
```

---

## Models

### Profile

```prisma
model Profile {
  id           String    @id
  name         String
  email        String    @unique
  studentId    String?   @unique
  accountType  String?   // StdAcc, MISEmpAcc
  cmuItAccount String?
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt

  userRole      UserRole?
  documents     Document[]
  activityLogs  ActivityLog[]
}
```

ข้อมูลที่ดึงจาก CMU Login อัตโนมัติเมื่อล็อกอิน: name, email, studentId, accountType, cmuItAccount

**ข้อมูลวิทยานิพนธ์ไม่เก็บใน DB** — ดึงจาก Thesis API ทุกครั้งที่แสดงผล (title_th, title_en, major_th, level_name_th, curriculum)

### UserRole

```prisma
model UserRole {
  id      String  @id @default(cuid())
  userId  String  @unique
  role    AppRole
  profile Profile @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```

`userId` is `@unique` — one role per user. Role determined by `accountType`: `StdAcc` → STUDENT, `MISEmpAcc` → ADMIN.

### Document

```prisma
model Document {
  id           String         @id @default(cuid())
  userId       String
  title        String         // ชื่อเครื่องมือวิจัย (นักศึกษากรอก)
  fileName     String         // ชื่อไฟล์บนเซิร์ฟเวอร์ ({studentId}_{n}.pdf)
  originalName String         // ชื่อไฟล์ต้นฉบับ
  fileSize     Int            // ขนาดไฟล์ (bytes)
  status       DocumentStatus @default(PENDING)
  approvedBy   String?        // อีเมลผู้อนุมัติ/ปฏิเสธ
  approvedAt   DateTime?      // เวลาที่อนุมัติ/ปฏิเสธ
  adminNotes   String?        // หมายเหตุ (กรณีปฏิเสธ)
  createdAt    DateTime       @default(now())
  updatedAt    DateTime       @updatedAt

  profile Profile @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([status])
  @@index([createdAt])
}
```

ฟิลด์ที่นักศึกษากรอกเอง: `title`, `fileName`, `originalName`, `fileSize` (ผ่านอัปโหลด PDF)

### ActivityLog

```prisma
model ActivityLog {
  id          String         @id @default(cuid())
  action      ActivityAction
  userId      String
  targetType  String?        // "Document" | "Profile"
  targetId    String?
  targetLabel String?        // "สมชาย → The Positive Discipline Questionnaire"
  metadata    String?
  createdAt   DateTime       @default(now())
  profile     Profile        @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([action])
  @@index([targetType])
  @@index([userId])
  @@index([createdAt])
}
```

---

## Relations

```
Profile 1──1 UserRole
Profile 1──N Document
Profile 1──N ActivityLog
```

---

## File Storage

```
uploads/
├── {studentId_1}/
│   ├── {studentId_1}_1.pdf
│   ├── {studentId_1}_2.pdf
│   └── ...
├── {studentId_2}/
│   ├── {studentId_2}_1.pdf
│   └── ...
└── ...
```

- รองรับเฉพาะ PDF
- ขนาดสูงสุด 100 MB ต่อไฟล์
- ชื่อไฟล์อัตโนมัติ: `{studentId}_{ลำดับ}.pdf`

---

## Seed Data (Dev)

- 1 admin profile + role
- 4 student profiles + roles (Thai names, CMU-style student IDs)
- 8-10 documents across PENDING/APPROVED/REJECTED statuses
- Matching activity log entries
