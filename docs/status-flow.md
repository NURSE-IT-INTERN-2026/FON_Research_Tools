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
| — | PENDING | นักศึกษาอัปโหลดเอกสาร | บันทึกลง ActivityLog |
| PENDING | APPROVED | แอดมินอนุมัติ (ทีละฉบับ หรือ "อนุมัติทั้งหมด") | set approvedBy, approvedAt; ส่งอีเมลแจ้งนักศึกษา (Post-MVP) |
| PENDING | REJECTED | แอดมินปฏิเสธ (พร้อมเหตุผล) | set approvedBy, approvedAt, adminNotes; ส่งอีเมลแจ้งนักศึกษา (Post-MVP) |
| PENDING | (deleted) | นักศึกษาลบเอกสารตัวเอง | ลบไฟล์ + ลบ record |
| any | (deleted) | แอดมินลบเอกสาร | ลบไฟล์ + ลบ record |

### Immutable rules

- APPROVED และ REJECTED เป็น terminal states — เปลี่ยนสถานะต่อไม่ได้
- นักศึกษาลบได้เฉพาะ PENDING ของตัวเอง
- แอดมินลบได้ทุกสถานะ
- "อนุมัติทั้งหมด" กระทบเฉพาะ PENDING เท่านั้น — APPROVED ที่ผ่านมาแล้วไม่ถูก approve ซ้ำ

---

## Bulk Approve Flow

```
แอดมินกด "อนุมัติทั้งหมด"
    │
    ▼
ค้นหาเอกสารทั้งหมดที่ status = PENDING
    │
    ▼
อัปเดตทุกฉบับ → APPROVED
  - set approvedBy = admin email
  - set approvedAt = now
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
