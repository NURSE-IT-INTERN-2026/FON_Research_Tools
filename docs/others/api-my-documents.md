# API `/api/my/documents` — ตรวจสอบสถานะเอกสารนักศึกษา

## วัตถุประสงค์

API สำหรับแอดมินตรวจสอบว่านักศึกษาได้รับการอนุมัติเอกสารเมื่อไหร่ เป็นข้อมูลหลังบ้าน ไม่ได้แสดงที่หน้า UI ของนักศึกษา

## Endpoint

```
GET /api/my/documents?studentId={รหัสนักศึกษา}
```

## สิทธิ์การเข้าถึง

| Role | สิทธิ์ |
|---|---|
| ADMIN | เรียกดูได้ |
| STUDENT | 403 Forbidden |
| ไม่ได้ล็อกอิน | 401 Unauthorized |

## Parameter

| Parameter | ต้องระบุ | ประเภท | ตัวอย่าง | คำอธิบาย |
|---|---|---|---|---|
| `studentId` | ใช่ | string | `681231104` | รหัสนักศึกษา |

## Response

### 200 OK

```json
{
  "documents": [
    {
      "id": "clx...",
      "title": "แบบสอบถามความเครียด",
      "status": "APPROVED",
      "createdAt": "2026-05-18T10:30:00.000Z",
      "approvedAt": "2026-05-19T14:00:00.000Z",
      "adminNotes": null
    },
    {
      "id": "cly...",
      "title": "แบบวัดภาวะซึมเศร้า",
      "status": "REJECTED",
      "createdAt": "2026-05-10T08:15:00.000Z",
      "approvedAt": "2026-05-11T09:30:00.000Z",
      "adminNotes": "ไฟล์ไม่ชัด กรุณาอัปโหลดใหม่"
    }
  ]
}
```

### ฟิลด์ใน Response

| ฟิลด์ | ประเภท | คำอธิบาย |
|---|---|---|
| `id` | string | รหัสเอกสาร |
| `title` | string | ชื่อเครื่องมือวิจัย |
| `status` | string | สถานะ: `PENDING`, `APPROVED`, `REJECTED` |
| `createdAt` | string (ISO) | วันเวลาที่นักศึกษาอัปโหลด |
| `approvedAt` | string (ISO) \| null | วันเวลาที่แอดมินอนุมัติ/ปฏิเสธ |
| `adminNotes` | string \| null | หมายเหตุ (กรณีปฏิเสธ) |

### Error Response

| Status | เงื่อนไข | Response |
|---|---|---|
| 400 | ไม่ส่ง `studentId` | `{ "error": "Missing studentId parameter" }` |
| 401 | ไม่ได้ล็อกอิน | `{ "error": "Unauthorized" }` |
| 403 | ไม่ใช่ ADMIN | `{ "error": "Forbidden" }` |
| 404 | ไม่พบรหัสนักศึกษา | `{ "error": "Student not found" }` |

## ใช้ที่ไหน

- **หลังบ้าน** — แอดมินเรียกผ่าน browser หรือ tool อื่น ๆ เพื่อตรวจสอบเวลาอนุมัติของนักศึกษาแต่ละคน
- **ไม่ได้เชื่อมกับ UI** — ข้อมูลนี้แสดงอยู่แล้วที่หน้า Admin Documents (`/admin/documents`) ในคอลัมน์ "วันที่อนุมัติ"

## ตัวอย่างการเรียก

```bash
curl http://localhost:4141/researchtool/api/my/documents?studentId=681231104 \
  --cookie "app_session=<session_token>"
```

## ไฟล์ที่เกี่ยวข้อง

| ไฟล์ | บทบาท |
|---|---|
| `src/app/api/my/documents/route.ts` | Route handler |
| `src/lib/auth/session-token.ts` | ตรวจสอบ session token |
| `src/lib/db.ts` | Prisma client |
| `docs/_features.md` (F14) | Feature tracker |
