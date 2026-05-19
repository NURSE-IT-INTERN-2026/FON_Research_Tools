# โครงสร้างฐานข้อมูลและการจัดเก็บไฟล์

## การเชื่อมต่อฐานข้อมูล

ระบบใช้ฐานข้อมูล **2 แหล่ง** ดังนี้:

### 1. SQL Server — `FON_ResearchTool`
- **เซิร์ฟเวอร์:** `172.20.0.2`
- **ฐานข้อมูล:** `FON_ResearchTool`
- **ผู้ใช้งาน:** `nursedb`
- **วัตถุประสงค์:** เก็บข้อมูลเอกสารที่อัปโหลด (เครื่องมือวิจัย)

### 2. MS Access — `Student-Thesis.mdb`
- **ประเภท:** OLEDB (Microsoft Access)
- **วัตถุประสงค์:** ข้อมูลวิทยานิพนธ์นักศึกษา (ใช้ผ่าน MIS_NEO_Connection.dll)

---

## โครงสร้างตารางที่คาดการณ์ได้ (Inferred Schema)

### ตาราง: TB_Document (เอกสารเครื่องมือวิจัย)

จากการวิเคราะห์โค้ดใน `ClsDocuments` (เรียกผ่าน `FON_ResearchTool_Lib.dll`):

| คอลัมน์ | ประเภท | คำอธิบาย |
|---|---|---|
| `int_list_no` | INT (PK, Auto) | เลขลำดับเอกสาร (Primary Key) |
| `txt_stuid` | VARCHAR | รหัสนักศึกษา (Foreign Key) |
| `txt_title` | VARCHAR | ชื่อเอกสารเครื่องมือวิจัย |
| `txt_filename` | VARCHAR | ชื่อไฟล์ที่จัดเก็บบนเซิร์ฟเวอร์ |
| `int_list_status` | INT | สถานะ: `0` = รออนุมัติ, `1` = อนุมัติแล้ว |

---

## Operations ที่ใช้กับฐานข้อมูล

### ClsDocuments — Methods

| Method | ประเภท | คำอธิบาย | ใช้ในหน้า |
|---|---|---|---|
| `xSelectDocumentAll()` | SELECT | ดึงข้อมูลเอกสารทั้งหมด | ResearchToolList.aspx |
| `xSelectDocumentByStudentID(stuid)` | SELECT | ดึงข้อมูลเอกสารตามรหัสนักศึกษา | ResearchTool.aspx, Student.aspx |
| `xCreateTBDocument()` | INIT | เตรียมตาราง/สร้าง record | Student.aspx |
| `xInsertDocument()` | INSERT | เพิ่มข้อมูลเอกสารใหม่ | Student.aspx |
| `xRemoveDocument(int_list_no)` | DELETE | ลบข้อมูลเอกสาร | Student.aspx |
| `xApproveDocument(int_list_no, approver)` | UPDATE | อนุมัติเอกสาร | Student.aspx |

### External API Calls

| Function | คำอธิบาย | ใช้ในหน้า |
|---|---|---|
| `xSelectThesisByKeyword` | ค้นหาวิทยานิพนธ์จาก Keyword | Default.aspx |
| `xSelectStudentByStudentID` | ดึงข้อมูลนักศึกษาตามรหัส | ResearchTool.aspx, Student.aspx |

---

## การจัดเก็บไฟล์ (File Storage)

### โครงสร้างโฟลเดอร์

```
upload/
├── {StudentID_1}/
│   ├── {StudentID_1}_1.pdf
│   ├── {StudentID_1}_2.pdf
│   └── ...
├── {StudentID_2}/
│   ├── {StudentID_2}_1.pdf
│   └── ...
└── ...
```

### กฎการตั้งชื่อไฟล์
- รูปแบบ: `{StudentID}_{ลำดับ}.pdf`
- ลำดับเริ่มจาก 1 และเพิ่มขึ้นอัตโนมัติเพื่อป้องกันชื่อไฟล์ซ้ำ
- ตัวอย่าง: `620511001_1.pdf`, `620511001_2.pdf`

### ข้อจำกัดการอัปโหลด
| รายการ | ค่า |
|---|---|
| ประเภทไฟล์ที่รองรับ | PDF เท่านั้น |
| จำนวนไฟล์สูงสุดต่อครั้ง | 10 ไฟล์ |
| ขนาดไฟล์สูงสุด | 100 MB |
| ขนาด Request สูงสุด | ~100 MB (ตั้งค่าใน Web.config) |

### การลบไฟล์
เมื่อลบเอกสาร ระบบจะ:
1. ลบ record ในฐานข้อมูล (`xRemoveDocument`)
2. ลบไฟล์จริงจากเซิร์ฟเวอร์ (`File.Delete`)


### ตัวอย่างข้อมูลเดิมที่เก็บ
int_list_no=1699
txt_stuid=631251001
txt_title=Chayapa Boonlue/The Positive Discipline Questionnaire/The Nurturing Care Questionnaire/Instruments for qualitative data collection  
txt_filename=631251001_1.pdf
int_list_status=1   `approve/pending`
dt_insert_date=2026-04-30 14:57:44.247
dt_update_date=2026-05-01 13:18:10.407
txt_approve_by=supapan.ch@cmu.ac.th
