# ระบบยืนยันตัวตน (Authentication)

## วิธีการล็อกอิน
ระบบใช้ **CMU Microsoft Azure AD OAuth 2.0** ในการยืนยันตัวตน โดยเชื่อมต่อกับระบบ CMU MIS (Management Information System)

## ขั้นตอนการทำงาน (Authentication Flow)

```
┌──────────┐     ┌──────────────────┐     ┌──────────────────┐     ┌───────────────┐
│  ผู้ใช้งาน  │────→│  Login.aspx       │────→│  Microsoft Azure  │────→│  CMU MIS API  │
│  กด Login │     │  (Redirect)       │     │  AD OAuth 2.0     │     │  /v3/me/      │
└──────────┘     └──────────────────┘     └──────────────────┘     └───────────────┘
                                                │                        │
                                                │ Authorization Code     │ User Profile
                                                │                        │
                                                ▼                        ▼
                                         Login.aspx.cs              ตั้งค่า Session
                                         (รับ Code + Exchange       และ Redirect
                                          เป็น Access Token)
```

### ขั้นตอนที่ 1: เปลี่ยนเส้นทางไป Microsoft OAuth
- เมื่อผู้ใช้กดปุ่ม Login ระบบจะเปลี่ยนเส้นทางไปยัง:
  - `https://login.microsoftonline.com/{tenant-id}/oauth2/v2.0/authorize`
- พารามิเตอร์ที่ส่งไป:
  - `client_id` — รหัสแอปพลิเคชันที่ลงทะเบียนใน Azure AD
  - `redirect_uri` — `https://mis.nurse.cmu.ac.th/researchTool/Login.aspx`
  - `response_type=code` — ขอ Authorization Code
  - `scope=openid profile email`

### ขั้นตอนที่ 2: รับ Authorization Code และแลกเป็น Access Token
- Microsoft ส่ง `code` กลับมาที่ Login.aspx ผ่าน Query String
- ระบบส่ง POST Request ไปยัง Token Endpoint เพื่อแลก Code เป็น Access Token

### ขั้นตอนที่ 3: เรียกข้อมูลผู้ใช้จาก CMU MIS API
- ใช้ Access Token เรียก API:
  - `https://mis.cmu.ac.th/mis/cmuaccount/prod/v3/me/basicinfo`
- ข้อมูลที่ได้รับ: ชื่อ-สกุล, CMU IT Account, ประเภทบัญชี, รหัสนักศึกษา

### ขั้นตอนที่ 4: ตั้งค่า Session และเปลี่ยนเส้นทาง

| Session Key | ความหมาย |
|---|---|
| `UserFullname` | ชื่อ-สกุล ผู้ใช้งาน |
| `cmuitaccount_name` | CMU IT Account Username |
| `useritm_itaccount_type_id` | ประเภทบัญชี (`StdAcc`, `MISEmpAcc`, `AlumAcc`) |
| `student_id` | รหัสนักศึกษา (สำหรับบทบาทนักศึกษา) |

### การเปลี่ยนเส้นทางหลังล็อกอิน

| ประเภทบัญชี | เปลี่ยนเส้นทางไป |
|---|---|
| `StdAcc` (นักศึกษา) | `Student.aspx` |
| `MISEmpAcc` (เจ้าหน้าที่) | `Default.aspx` |
| `AlumAcc` (ศิษย์เก่า) | ไม่มีการเปลี่ยนเส้นทาง |

---

## การออกจากระบบ (Logout)

**ไฟล์:** `Logout.aspx.cs`

### ขั้นตอน:
1. เคลียร์ Session ทั้งหมด (`Session.Clear()`)
2. เปลี่ยนเส้นทางไป `Default.aspx`

---

## การตรวจสอบสิทธิ์ใน Master Page

**ไฟล์:** `mpMain.master.cs`

### การทำงาน:
- ทุกครั้งที่โหลดหน้าเว็บ จะตรวจสอบ Session ใน `Page_Init`
- ตรวจสอบว่า `Session["cmuitaccount_name"]` มีค่าหรือไม่
- ถ้ามี → ตรวจสอบประเภทบัญชีเพื่อแสดงเมนูที่เหมาะสม:
  - `StdAcc` → แสดงเมนูนักศึกษา (`pnStudent`)
  - `MISEmpAcc` → แสดงเมนูเจ้าหน้าที่ (`pnAdmin`)
- ถ้าไม่มี → แสดงลิงก์ Login ใน Navbar
- เรียก `ClsBase.xIsAdmin()` เพื่อตั้งค่า `Session["IsAdmin"]`

---

## Session Timeout
- ตั้งค่าไว้ที่ **480 นาที (8 ชั่วโมง)** ใน `Web.config`
