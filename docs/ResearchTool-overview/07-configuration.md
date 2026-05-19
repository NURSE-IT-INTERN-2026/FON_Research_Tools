# การตั้งค่าระบบ (Configuration)

## ไฟล์ Web.config — การตั้งค่าสำคัญ

### Database Connection Strings

#### SQL Server (ฐานข้อมูลหลัก)
```xml
<add name="Default" connectionString="Server=172.20.0.2;Database=FON_ResearchTool;User ID=nursedb;Password=***;" />
```

#### MS Access (ข้อมูลวิทยานิพนธ์)
```xml
<add name="ProviderStudent" connectionString="Provider=Microsoft.Jet.OLEDB.4.0;Data Source=...\Student-Thesis.mdb;" />
```

### Application Settings

| Key | ค่า | คำอธิบาย |
|---|---|---|
| `LogPath` | `D:\Developer\App\Log\log.txt` | ตำแหน่งไฟล์ Log |
| `FolderPath` | `C:\Users\IT-STAFF\Desktop\` | โฟลเดอร์สำหรับจัดเก็บไฟล์ชั่วคราว |

### การตั้งค่าอื่น ๆ

| รายการ | ค่า | หมายเหตุ |
|---|---|---|
| Target Framework | .NET Framework 4.5 | |
| Session Timeout | 480 นาที (8 ชั่วโมง) | |
| Max Request Length | 104,857 KB (~100 MB) | ขนาดไฟล์อัปโหลดสูงสุด |
| Max Allowed Content Length | 104,857,600 bytes (~100 MB) | |
| Custom Errors | Off | ⚠️ ควรเปิดใน Production |
| Compiler Language | C# 6 / VB 14 | Roslyn Compiler |

---

## ไลบรารีที่ใช้ (Bin/)

| DLL | คำอธิบาย |
|---|---|
| `FON_ResearchTool_Lib.dll` | Business Logic Library หลัก — มี `ClsBase`, `ClsStudent`, `ClsDocuments` |
| `MIS_NEO_Connection.dll` | Library สำหรับเชื่อมต่อฐานข้อมูล MS Access |
| `Microsoft.ApplicationBlocks.Data.dll` | Microsoft Data Access Application Block |
| `Newtonsoft.Json.dll` | JSON Serialization/Deserialization |
| `Microsoft.CodeDom.Providers.DotNetCompilerPlatform.dll` | Roslyn Compiler Provider |

---

## External APIs

### CMU MIS API — Student Thesis Profile
- **Base URL:** `http://mis.nurse.cmu.ac.th/api/StudentThesisProfile.aspx`
- **Functions:**
  - `xSelectThesisByKeyword` — ค้นหาวิทยานิพนธ์
  - `xSelectStudentByStudentID` — ดึงข้อมูลนักศึกษา

### CMU MIS API — User Profile
- **URL:** `https://mis.cmu.ac.th/mis/cmuaccount/prod/v3/me/basicinfo`
- **วัตถุประสงค์:** ดึงข้อมูลผู้ใช้หลัง OAuth Authentication

### Microsoft Azure AD OAuth 2.0
- **Tenant ID:** `cf81f1df-de59-4c29-91da-a2dfd04aa751`
- **Authorize URL:** `https://login.microsoftonline.com/{tenant}/oauth2/v2.0/authorize`
- **Token URL:** `https://login.microsoftonline.com/{tenant}/oauth2/v2.0/token`

---

## Master Page Layout

**ไฟล์:** `mpMain.master`

### Navigation Bar
```
┌─────────────────────────────────────────────────────────────────┐
│  FON : Research Tools        Home  |  Manual  |  Login         │
│                                           ┌── Admin Panel ──┐  │
│                                           │ Research Tool    │  │
│                                           │   Approvement   │  │
│                                           │ Logout          │  │
│                                           └─────────────────┘  │
│                                           ┌── Student Panel ─┐ │
│                                           │ Upload Research  │  │
│                                           │   Tool           │  │
│                                           │ Logout           │  │
│                                           └──────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### การแสดงเมนูตามสถานะผู้ใช้
| สถานะ | เมนูที่แสดง |
|---|---|
| ยังไม่ล็อกอิน | Home, Manual, Login |
| ล็อกอินแล้ว (นักศึกษา) | Home, Manual, Student Panel (Upload Research Tool, Logout) |
| ล็อกอินแล้ว (เจ้าหน้าที่) | Home, Manual, Admin Panel (Research Tool Approvement, Logout) |
