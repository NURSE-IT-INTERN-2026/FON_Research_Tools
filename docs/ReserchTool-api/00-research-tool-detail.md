# ข้อมูลสำหรับจัดทำระบบ Research Tool
ให้กำหนด Port และ Base Path เริ่มต้นไว้ที่: localhost:4141/researchtool
Redirect URL ที่กำหนดไว้ใน Azure: http://localhost:4141/researchtool/api/auth/callback

# Environment Variables
- DATABASE_URL="sqlserver://localhost:1433;database=ResearchTool;user=your_user;password=your_password;encrypt=true;trustServerCertificate=true"
- DATABASE ORM: Prisma ORM
- REDIRECT_URL=http://localhost:4141/researchtool/api/auth/callback
- CLIENT_ID=1bdd2bf2-8275-45ee-862c-848e560b4f4c
- CLIENT_SECRET={{CMU_OAUTH_CLIENT_SECRET}}
- CMU_GET_TOKEN=https://login.microsoftonline.com/cf81f1df-de59-4c29-91da-a2dfd04aa751/oauth2/v2.0/token
- CMU_BASIC_INFO=https://api.cmu.ac.th/mis/cmuaccount/prod/v3/me/basicinfo
- SCOPE=api://cmu/Mis.Account.Read.Me.Basicinfo
- JWT_SECRET={{APP_JWT_SECRET}}
- NEXT_PUBLIC_BASE_PATH="/researchtool"

# API ดึงหัวข้อวิทยานิพนธ์
REQUEST HEADERS
- ข้อมูลรายบุคคล URL : https://mis.nurse.cmu.ac.th/thesis/student/GetDataThesis?student_id=621251008
- Method : POST
- Authorization : Bearer {{ACCESS_TOKEN}}

# Response data ที่ใช้ = ✅
{
    "count": 1,
    "students": [
        {
            "student_id": "681231104", ✅ `รหัส นศ`
            "title_th": "ประสิทธิผลของโปรแกรมส่งเสริมสุขภาพการได้ยินในคนงานโรงงานอุตสาหกรรมขนาดใหญ่",   ✅ `หัวข้อภาษาไทย`
            "title_en": "Effectiveness of the Healthy Hearing Promoting Program Among Workers in Large-Scale Industries", ✅ `หัวข้อภาษาอังกฤษ`
            "foreign_language_status": "Success",
            "foreign_language_comment": "e-TEGS คะแนน : 83",
            "qualification_status": "Success",
            "qualification_comment": ""
            "curriculum": "หลักสูตรปกติ" ✅ `ประเภทหลักสูตร หลักสูตรปกติ/หลักสูตรนานาชาติ`
            "major_th": "พยาบาลศาสตร์" ✅ `ชื่อสาขาวิชา`
            "level_name_th": "ปริญญาเอก" ✅  `ระดับการศึกษา: ปริญญาโท/ปริญญาเอก`
            "cmu_account": "ittipol_k@cmu.ac.th" ✅ `อีเมล`
        }
    ]
}

# ผู้ใช้งาน 2 บทบาท
1. นักศึกษา (Student)
- ล็อกอินด้วย CMU Account
- ระบบดึงข้อมูลส่วนตัวได้แก่ `title_th`, `title_en`, `curriculum`, `major_th`, `level_name_th`, `cmu_account`
- อัปโหลดเอกสารเครื่องมือวิจัย (PDF) พร้อมกรอก ชื่อเครื่องมือ
- ดูสถานะเอกสารตัวเอง
- ลบเอกสารของตัวเอง (เฉพาะที่ยังไม่ได้อนุมัติ)
- เมื่อกด Submit ให้ส่ง EMAIL แจ้งเตือนให้เจ้าหน้าที่ email to:`supapan.ch@cmu.ac.th` cc:`ampika.s@cmu.ac.th`  2 คนนี้เป็น ADMIN
- status: รอตรวจสอบ, อนุมัติแล้ว, ปฏิเสธ
- วันที่ยื่น, วันที่อนุมัติ, ผู้ออนุมัติ
- มีปุ่ม DOWNLOAD PDF รายละเอียดที่จะแสดงใน PDF เมื่อได้รับอนุมัติจาก ADMIN แล้ว
    - ชื่อระบบ "Research Tool" Faculty of Nursing, Chiang Mai University
    - ชื่อนักศึกษา, รหัส
    - รายการเครื่องมือ ......
    - ได้บันทึกข้อมูลเครื่องมือวิจัยแล้วเมื่อวันที่.....

2. เจ้าหน้าที่ (Admin)
- ล็อกอินด้วย CMU Account
❌- ดู Dashboard: จำนวนนักศึกษาทั้งหมด, เอกสารทั้งหมด, รอตรวจสอบ, อนุมัติแล้ว + กิจกรรมล่าสุด (Focus แค่งาน ResearchTool เท่านั้น)

- ดูรายการเอกสารทั้งหมด พร้อมกรองตามสถานะ
    `1. มี Card ด้านบน รอตรวจสอบ (5), อนุมัติแล้ว (10), เครื่องมือทั้งหมด (20)`
    `2. แสดงตารางข้อมูล (ทำ Backend Pagination)`
    `3. Filter: สถานะ`
    `4. Export CSV รายการเอกสาร (Export ตาม Filter ที่เลือก เช่น เฉพาะ "อนุมัติแล้ว") ข้อมูลที่ export: ชื่อเครื่องมือ, ชื่อนักศึกษา, รหัสนักศึกษา, สถานะ, วันที่ยื่น, วันที่อนุมัติ`
- อนุมัติเอกสาร → สถานะเปลี่ยนเป็น "อนุมัติแล้ว" + ส่งอีเมลแจ้งนักศึกษา
- ปฏิเสธเอกสารพร้อมระบุเหตุผล → สถานะเปลี่ยนเป็น "ปฏิเสธแล้ว" + ส่งอีเมลแจ้งนักศึกษา
- ดู/เปิดไฟล์ PDF เพื่อตรวจสอบความถูกต้องของเครื่องมือที่นักศึกษาอัปโหลด
- ลบเอกสารได้
- ดูรายชื่อนักศึกษาทั้งหมดพร้อมจำนวนเอกสาร
- ค้นหานักศึกษาตามชื่อเครื่องมือ, ชื่อนักศึกษา, รหัสนักศึกษา, ชื่อวิทยานิพันธ์
- ดูบันทึกกิจกรรม (Activity Log) `Backend Pagination` และ Date Filter เช่น อยากดู log ของวันที่ 19/5/2026
 
3. ข้อมูลที่เก็บ
- ชื่อ-นามสกุล, อีเมล, รหัสนักศึกษา: ได้จาก CMU ENTRA LOGIN (SCOPE) อัตโนมัติ
- ชื่อเครื่องมือวิจัย, ชื่อไฟล์, วันที่ยื่น, วันที่ได้รับอนุมัติ
- ❌ ภาควิชา, ระดับปริญญา, หลักสูตร
- ❌ ชื่อวิทยานิพนธ์ (ไทย/อังกฤษ)
 
4. เอกสารเครื่องมือวิจัย (Document)
- ชื่อเครื่องมือวิจัย
- ไฟล์ PDF

5. รายละเอียดเพิ่มเติม
- การเก็บไฟล์เก็บไว้ใน Project Folder เช่น /upload ใช้การเรียกไฟล์ผ่าน API เช่น
${process.env.NEXT_PUBLIC_REDIRECT_URI}/api/GetFile/${UniqeID}  ป้องกัน API Route GetFile ให้เข้าถึงได้เฉพาะผู้ที่ Login เท่านั้น

6. ต่อยอดฟีเจอร์
- ฟีเจอร์เก็บประวัติการนำไปใช้ประโยชน์ของเครื่องมือนั้นๆ เช่น ชื่อผู้ขอ, วันที่ขอ, รายละเอียดเพิ่มเติม
- อาจใช้ OCR เข้ามาช่วยเจ้าหน้าที่ไม่ต้องพิมพ์เอง Capture Email > Browse Capture > Form > Submit

# Email API แจ้งเตือน
- สามารถดูได้จาก Email_API_Manual.PDF