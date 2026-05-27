# Status Flow — Document State Machine

---

## Document Status

```
                    ┌──────────────────┐
                    │                  │
   นักศึกษา         │    PENDING       │
   อัปโหลด          │   รอตรวจสอบ      │
  ─────────────►    └────────┬─────────┘
                            │
                   ┌────────┴─────────┐
                   │                  │
              ┌────▼─────┐     ┌─────▼─────┐
              │          │     │           │
              │ APPROVED │     │ REJECTED  │
              │อนุมัติแล้ว  │     │ปฏิเสธแล้ว   │
              │          │     │           │
              └──────────┘     └───────────┘
```

---

## Document Status Transitions

| From | To | Triggered By | Side Effects |
|---|---|---|---|
| — | PENDING | นักศึกษาอัปโหลดเอกสาร | บันทึกลง ActivityLog; ส่งอีเมลแจ้งแอดมิน (supapan.ch@cmu.ac.th cc ampika.s@cmu.ac.th) |
| PENDING | APPROVED | แอดมินอนุมัติ (ทีละฉบับ หรือ "อนุมัติทั้งหมด") | set approvedBy, approvedAt; เช็คว่านักศึกษา **ไม่มี PENDING เหลือ** → ส่งอีเมลแจ้งนักศึกษา 1 ฉบับ |
| PENDING | REJECTED | แอดมินปฏิเสธ (พร้อมเหตุผล) | set approvedBy, approvedAt, adminNotes; ส่งอีเมลแจ้งนักศึกษาพร้อมเหตุผลทันที |
| PENDING | (deleted) | นักศึกษาลบเอกสารตัวเอง | ลบไฟล์ + ลบ record |
| any | (deleted) | แอดมินลบเอกสาร | ลบไฟล์ + ลบ record |

### Immutable rules

- APPROVED และ REJECTED เป็น terminal states — เปลี่ยนสถานะต่อไม่ได้
- นักศึกษาลบได้เฉพาะ PENDING ของตัวเอง
- แอดมินลบได้ทุกสถานะ
- "อนุมัติทั้งหมด" กระทบเฉพาะ PENDING เท่านั้น — APPROVED ที่ผ่านมาแล้วไม่ถูก approve ซ้ำ

---

## Bulk Approve Flow (Per-Student)

```
แอดมินกด "อนุมัติทั้งหมด" บนแถวเอกสารของนักศึกษาคนใดคนหนึ่ง
    │
    ▼
ค้นหาเอกสารทั้งหมดที่ userId = นักศึกษาคนนั้น AND status = PENDING
    │
    ▼
อัปเดตทุกฉบับ → APPROVED
  - set approvedBy = admin userId
  - set approvedAt = now
    │
    ▼
ส่งอีเมลแจ้งนักศึกษาทันที
  - แสดงรายการเอกสารที่อนุมัติ
    │
    ▼
นักศึกษาเพิ่มเครื่องมือใหม่ครั้งที่ 2
  → เอกสารใหม่เป็น PENDING
  → แอดมินกด "อนุมัติทั้งหมด" อีกครั้งได้
  → approve เฉพาะ PENDING ใหม่เท่านั้น
  → APPROVED เดิมไม่กระทบ
```

---

## Student Status (from CMU MIS API)

ไม่ใช่ state machine — เป็นข้อมูลแสดงผลเท่านั้น:

| สถานะ | Thai Label | สี Badge |
|---|---|---|
| Active | กำลังศึกษา | เขียว |
| Resigned | ลาออก | เทา |
| Dismissed | พ้นสภาพ | แดง |

---

## Borrowing Status (F20-A)

```
                    ┌──────────────────┐
                    │                  │
   นักศึกษา         │    PENDING       │
   ส่งคำขอยืม       │   รอตรวจสอบ      │
  ─────────────►    └────────┬─────────┘
                            │
                   ┌────────┴─────────┐
                   │                  │
              ┌────▼─────┐     ┌─────▼─────┐
              │          │     │           │
              │ APPROVED │     │ REJECTED  │
              │อนุมัติแล้ว  │     │ปฏิเสธแล้ว   │
              │          │     │           │
              └──────────┘     └───────────┘
```

---

## Borrowing Status Transitions

| From | To | Triggered By | Side Effects |
|---|---|---|---|
| — | PENDING | นักศึกษาส่งคำขอยืม (เลือกเครื่องมือ + อัปโหลดใบอนุญาต) | บันทึกลง ActivityLog (BORROW_SUBMIT) |
| PENDING | APPROVED | แอดมินอนุมัติ | set approvedBy, approvedAt; บันทึกลง ActivityLog (BORROW_APPROVE) |
| PENDING | REJECTED | แอดมินปฏิเสธ (พร้อมเหตุผล) | set approvedBy, approvedAt, adminNotes; บันทึกลง ActivityLog (BORROW_REJECT) |
| PENDING | (deleted) | นักศึกษาลบคำขอของตัวเอง | ลบไฟล์ + ลบ record |
| any | (deleted) | แอดมินลบ | ลบไฟล์ + ลบ record |

### Immutable rules

- APPROVED และ REJECTED เป็น terminal states — เปลี่ยนสถานะต่อไม่ได้
- นักศึกษาลบได้เฉพาะ PENDING ของตัวเอง
- แอดมินลบได้ทุกสถานะ
