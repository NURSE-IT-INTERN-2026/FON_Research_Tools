# ภาพรวมระบบ FON Research Tool

## ชื่อระบบ
**FON Research Tool** — ระบบจัดการเครื่องมือวิจัย (Research Tools)

## หน่วยงานเจ้าของระบบ
คณะพยาบาลศาสตร์ มหาวิทยาลัยเชียงใหม่ (Faculty of Nursing, CMU)

## วัตถุประสงค์ของระบบ
ระบบนี้ใช้สำหรับจัดการเอกสารเครื่องมือวิจัย (เช่น แบบสอบถาม, แบบประเมิน) ที่เกี่ยวข้องกับวิทยานิพนธ์และการศึกษาอิสระของนักศึกษา โดยครอบคลุมการทำงานดังนี้:

1. **การค้นหาข้อมูลวิทยานิพนธ์** — ค้นหาจากคำค้นหลัก (Keyword)
2. **การอัปโหลดเอกสาร** — นักศึกษาอัปโหลดเอกสารเครื่องมือวิจัยในรูปแบบ PDF
3. **การอนุมัติเอกสาร** — เจ้าหน้าที่/อาจารย์ ตรวจสอบและอนุมัติเอกสารที่นักศึกษาอัปโหลด
4. **การจัดเก็บเอกสาร** — จัดเก็บไฟล์บนเซิร์ฟเวอร์พร้อมฐานข้อมูล

---

## เทคโนโลยีที่ใช้

| ส่วนประกอบ | เทคโนโลยี |
|---|---|
| Framework | ASP.NET Web Forms 4.5 (C#) |
| UI Framework | Bootstrap 4 + SB-Admin Template |
| JavaScript Library | jQuery, Chart.js, DataTables, Font Awesome |
| Database | SQL Server (`FON_ResearchTool`) |
| Authentication | CMU Microsoft Azure AD OAuth 2.0 |
| External API | CMU MIS API (Student Thesis Profile) |
| Business Logic Library | `FON_ResearchTool_Lib.dll` |

---

## บทบาทผู้ใช้งาน (User Roles)

| บทบาท | รหัส `itaccount_type_id` | สิทธิ์การเข้าถึง |
|---|---|---|
| **นักศึกษาปัจจุบัน** | `StdAcc` | อัปโหลดเอกสาร, ดูข้อมูลตัวเอง, ลบเอกสารของตัวเอง |
| **เจ้าหน้าที่/อาจารย์** | `MISEmpAcc` | ค้นหาวิทยานิพนธ์, อนุมัติ/ปฏิเสธเอกสาร, ดูเอกสารทั้งหมด, ลบเอกสาร |
| **ศิษย์เก่า** | `AlumAcc` | ไม่มีสิทธิ์เข้าถึง (ระบบไม่มีหน้าสำหรับศิษย์เก่า) |

---

## โครงสร้างไฟล์โปรเจกต์

```
ResearchTool/
├── Login.aspx / .cs          → หน้าล็อกอิน (OAuth CMU)
├── Default.aspx / .cs        → หน้าหลัก (ค้นหาวิทยานิพนธ์)
├── Logout.aspx / .cs         → หน้าออกจากระบบ
├── mpMain.master / .cs       → Master Page (เมนูนำทาง, Layout หลัก)
├── ResearchTool.aspx / .cs   → หน้ารายละเอียดวิทยานิพนธ์ (Read-only)
├── ResearchToolList.aspx / .cs → หน้ารายการเอกสารรออนุมัติ (Admin)
├── Student.aspx / .cs        → หน้าจัดการเอกสารของนักศึกษา (Upload/Remove/Approve)
├── StudentAdmin.aspx / .cs   → หน้าจัดการเอกสารเวอร์ชัน Admin (เก่า/ไม่ได้ใช้)
├── Manual.aspx / .cs         → หน้าคู่มือการใช้งาน (แสดง PDF)
├── Unauthorized.aspx / .cs   → หน้าแจ้งไม่มีสิทธิ์เข้าถึง
├── Web.config                → ไฟล์ Config หลัก
├── Bin/                      → DLL Libraries
├── css/                      → Stylesheets
├── js/                       → JavaScript files
├── img/                      → รูปภาพ
├── docs/                     → เอกสาร (Manual PDF)
├── vendor/                   → Third-party libraries
└── upload/                   → โฟลเดอร์เก็บไฟล์ที่อัปโหลด
```
