# ตัวแปร Session ที่ใช้ในระบบ

## รายการ Session Variables

| Session Key | ประเภท | คำอธิบาย | ตั้งค่าที่ | ใช้ที่ |
|---|---|---|---|---|
| `UserFullname` | String | ชื่อ-สกุล ผู้ใช้งาน | Login.aspx.cs | mpMain.master.cs |
| `cmuitaccount_name` | String | CMU IT Account Username | Login.aspx.cs | mpMain.master.cs, ResearchToolList.aspx.cs |
| `useritm_itaccount_type_id` | String | ประเภทบัญชี (`StdAcc`, `MISEmpAcc`, `AlumAcc`) | Login.aspx.cs | mpMain.master.cs |
| `student_id` | String | รหัสนักศึกษา | Login.aspx.cs, Default.aspx.cs, ResearchToolList.aspx.cs | Student.aspx.cs |
| `IsAdmin` | Boolean | สิทธิ์ Admin (`true`/`false`) | mpMain.master.cs | Default.aspx.cs, Student.aspx.cs |

## วงจรชีวิตของ Session

```
Login.aspx.cs
    │
    ├── Session["UserFullname"] = "ชื่อ นามสกุล"
    ├── Session["cmuitaccount_name"] = "cmu_username"
    ├── Session["useritm_itaccount_type_id"] = "StdAcc" | "MISEmpAcc"
    ├── Session["student_id"] = "620511001"
    │
    ▼
mpMain.master.cs (Page_Init — ทุกหน้า)
    │
    ├── ตรวจสอบ Session["cmuitaccount_name"] → แสดง/ซ่อนเมนู
    ├── Session["IsAdmin"] = true/false (จาก ClsBase.xIsAdmin)
    │
    ▼
Default.aspx.cs / ResearchToolList.aspx.cs
    │
    ├── Session["student_id"] = "{StudentID}" → ส่งไป Student.aspx
    │
    ▼
Student.aspx.cs
    │
    ├── อ่าน Session["student_id"] → โหลดข้อมูลนักศึกษา
    ├── อ่าน Session["IsAdmin"] → แสดง/ซ่อนปุ่ม Approve
    │
    ▼
Logout.aspx.cs
    │
    └── Session.Clear() → ล้าง Session ทั้งหมด
```

## Session Timeout
- **ค่าที่ตั้ง:** 480 นาที (8 ชั่วโมง)
- **ตั้งค่าใน:** `Web.config` → `<sessionState timeout="480" />`
- เมื่อ Session หมดอายุ ผู้ใช้จะต้องล็อกอินใหม่
