# Thesis Cache — ทำไมต้องเก็บ Cache Field

## หลักการ

ข้อมูลวิทยานิพนธ์ **ไม่ได้เก็บใน DB** ทุกอย่างยัง fetch จาก Thesis API ตามปกติทุกครั้งที่แสดงผล

แต่มี cache fields 2 ตัวที่เก็บใน Profile เพื่อให้ search ได้:

- `thesisTitleTh` — ชื่อวิทยานิพนธ์ภาษาไทย
- `thesisTitleEn` — ชื่อวิทยานิพนธ์ภาษาอังกฤษ

## ทำไมต้องมี Cache

Requirement (F12): Admin ต้องค้นหาจาก **ชื่อวิทยานิพนธ์** ได้

ปัญหาคือ Thesis API รับแค่ `?student_id=xxx` — ไม่มี search endpoint ดังนั้นไม่สามารถ search ด้วย keyword ได้โดยไม่เก็บข้อมูล

## Cache ทำงานยังไง

```
Student login (CMU OAuth)
  → upsertUser()
    → getThesisData(studentId)   ← fetch จาก Thesis API
    → เก็บ title_th, title_en ลง Profile ใน DB
```

- Cache อัปเดตอัตโนมัติทุกครั้งที่ student login
- ถ้า Thesis API ไม่ตอบหรือไม่มีข้อมูล → cache เป็น `null` (ไม่ break อะไร)
- มีผลกับ STUDENT เท่านั้น (ADMIN ไม่มี thesis)

## ข้อมูลไหนใช้ Cache ไหนใช้ API

| การใช้งาน | แหล่งข้อมูล |
|---|---|
| แสดงผลหน้า student (หัวข้อ, สาขา, ระดับ, หลักสูตร) | Thesis API (fetch ทุกครั้ง) |
| แสดงผลหน้า admin student detail | Thesis API (fetch ทุกครั้ง) |
| Search ชื่อวิทยานิพนธ์ (admin navbar) | DB cache field |
| Download PDF certificate | Thesis API (fetch ทุกครั้ง) |

## สรุป

Cache fields เป็นเพียงสำเนาข้อมูลสำหรับ search ข้อมูลต้นฉบับยังมาจาก Thesis API ทั้งหมด ถ้า thesis title เปลี่ยน cache จะอัปเดตใน login ครั้งถัดไปของ student คนนั้น
