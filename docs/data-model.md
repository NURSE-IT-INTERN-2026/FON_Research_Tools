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

enum BorrowingStatus {
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
  BORROW_SUBMIT
  BORROW_APPROVE
  BORROW_REJECT
  BORROW_REMOVE
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
  cmuItAccount String?
  role         AppRole   @default(STUDENT)
  thesisTitleTh String?
  thesisTitleEn String?
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt

  documents        Document[]
  borrowingRecords BorrowingRecord[]
  activityLogs     ActivityLog[]
}
```

ข้อมูลที่ดึงจาก CMU Login อัตโนมัติเมื่อล็อกอิน: name, email, studentId, cmuItAccount

Role กำหนดจาก DB: ถ้าอีเมลมีอยู่ในระบบเป็น ADMIN → ได้ ADMIN, อื่นๆ → ได้ STUDENT

**Cache fields:** `thesisTitleTh`, `thesisTitleEn` — เก็บจาก Thesis API ตอน student login เพื่อใช้ search เท่านั้น ข้อมูลแสดงผลยัง fetch จาก API ตามปกติ

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
  instrumentId String?        // link to Instrument (set when approved)
  createdAt    DateTime       @default(now())
  updatedAt    DateTime       @updatedAt

  profile Profile @relation(fields: [userId], references: [id], onDelete: Cascade)
  instrument Instrument? @relation(fields: [instrumentId], references: [id])

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
  targetType  String?        // "Document" | "Profile" | "BorrowingRecord"
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

### Instrument

```prisma
model Instrument {
  id        String   @id @default(cuid())
  name      String   @unique   // ชื่อเครื่องมือวิจัย (normalized)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  documents        Document[]
  borrowingRecords BorrowingRecord[]
}
```

สร้างอัตโนมัติเมื่อ Document ถูก APPROVED — ใช้ `upsert` ตามชื่อ (case-sensitive, trimmed)

### BorrowingRecord

```prisma
model BorrowingRecord {
  id                  String          @id @default(cuid())
  instrumentId        String          // เครื่องมือที่ขอยืม
  userId              String          // นักศึกษาผู้ขอยืม
  requesterName       String?         // ชื่อผู้ขอ (กรอกเอง / OCR)
  requestDate         DateTime?       // วันที่ขอ (กรอกเอง / OCR)
  additionalDetails   String?         // รายละเอียดเพิ่มเติม (กรอกเอง / OCR)
  licenseFileName     String?         // ไฟล์ใบอนุญาต PDF
  licenseOriginalName String?
  licenseFileSize     Int?
  status              BorrowingStatus @default(PENDING)
  approvedBy          String?
  approvedAt          DateTime?
  adminNotes          String?
  createdAt           DateTime        @default(now())
  updatedAt           DateTime        @updatedAt

  instrument Instrument @relation(fields: [instrumentId], references: [id])
  profile    Profile    @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([instrumentId])
  @@index([userId])
  @@index([status])
  @@index([createdAt])
}
```

ฟิลด์ที่นักศึกษากรอกเอง (F20-A): instrumentId, requesterName, requestDate, additionalDetails + อัปโหลด license PDF

---

## File Storage (Borrowing)

```
uploads/borrowing/
├── {recordId_1}.pdf
├── {recordId_2}.pdf
└── ...
```

- รองรับเฉพาะ PDF
- ขนาดสูงสุด 10 MB ต่อไฟล์
- ชื่อไฟล์อัตโนมัติ: `{BorrowingRecord.id}.pdf`

```
Profile 1──N Document
Profile 1──N BorrowingRecord
Profile 1──N ActivityLog
Instrument 1──N Document
Instrument 1──N BorrowingRecord
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

- 2 admin profiles
- 30 student profiles (Thai names, CMU-style student IDs)
- 15 documents for student 1, 1-3 docs for students 2-30
- 30 activity log entries
