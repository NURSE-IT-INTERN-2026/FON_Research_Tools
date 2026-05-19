# UI Pages — Layout & Component Specs

---

## Shared Components

### Sidebar (`src/components/sidebar.tsx`)

- Fixed width `w-64`, full height
- Sections: Logo area → Nav links → User footer
- Nav items: icon (Lucide) + label, active state highlight
- User footer: email display + sign-out button
- **Props:** `role: "ADMIN" | "STUDENT"`, `navItems`, `userEmail`
- **Theme:** Orange sidebar for student, purple for admin

### Status Badge (`src/components/status-badge.tsx`)

- Pill: `rounded-full px-2.5 py-0.5 text-xs font-medium border`
- **Props:** `status: DocumentStatus`
- Colors:
  - PENDING → เหลือง/ส้ม
  - APPROVED → เขียว
  - REJECTED → แดง

### Stat Card (`src/components/stat-card.tsx`)

- `rounded-xl border bg-card p-5 hover:shadow-md`
- Icon container + value + label
- **Props:** `icon`, `value: number`, `label: string`, `href: string`

### Filter Pills (`src/components/filter-pills.tsx`)

- Row of `rounded-full px-3 py-1 text-xs border` buttons
- Active: `bg-primary text-primary-foreground border-primary`
- **Client Component** — uses `useRouter` to update URL `searchParams`

---

## Public Pages

### Landing — `/`

- Full-screen centered layout (no sidebar)
- Logo + "Research Tools" title
- Description: ระบบจัดการเอกสารเครื่องมือวิจัย
- CTA button: "เข้าสู่ระบบด้วย CMU Account" (primary) → `/login`

### Login — `/login`

- Redirect ไป CMU Microsoft Azure AD OAuth 2.0 ทันที (ไม่มี form)
- หรือแสดงหน้า Loading ระหว่าง redirect

---

## Student Pages (orange theme, student sidebar)

### Student Dashboard — `/dashboard`

**แสดงทั้งหมดในหน้าเดียว:**

**ส่วนที่ 1: ข้อมูลส่วนตัว** (card)
- ชื่อ-นามสกุล, รหัสนักศึกษา, ภาควิชา, ระดับปริญญา, หลักสูตร
- ข้อมูลดึงจาก CMU MIS API อัตโนมัติ

**ส่วนที่ 2: ข้อมูลวิทยานิพนธ์** (card)
- ชื่อวิทยานิพนธ์ (ไทย/อังกฤษ)

**ส่วนที่ 3: อัปโหลดเอกสาร** (card with form)
- ช่องกรอก: ชื่อเครื่องมือวิจัย (Input)
- เลือกไฟล์: PDF file picker
- ปุ่ม Upload (primary, สีเขียว)
- Validation: PDF เท่านั้น, ขนาดสูงสุด 100 MB

**ส่วนที่ 4: รายการเอกสาร** (table)
- คอลัมน์: ลำดับ, ชื่อเครื่องมือวิจัย, ไฟล์ (link เปิด PDF), สถานะ (badge), วันที่, การดำเนินการ
- การดำเนินการ: ลบ (เฉพาะ PENDING)
- Empty state: ยังไม่มีเอกสาร

**Sidebar nav items (Student):**
- แดชบอร์ด (LayoutDashboard) → `/dashboard`

---

## Admin Pages (purple theme, admin sidebar)

### Navbar Search Button
- ปุ่ม search (Search icon) บน navbar ของ admin layout
- คลิก → เปิด search input/dropdown
- ค้นหาจาก: รหัสนักศึกษา, ชื่อ, ชื่อวิทยานิพนธ์
- ผลลัพธ์: แสดงรายการนักศึกษาที่ตรงกัน → คลิกเพื่อดูรายละเอียด

### Dashboard — `/admin/dashboard`

**Header:** "แดชบอร์ด" + "ภาพรวมการจัดการเอกสารเครื่องมือวิจัย"

**Stat Cards** (4-card grid):
| Label | Icon | Link |
|---|---|---|
| นักศึกษาทั้งหมด | Users | `/admin/students` |
| เอกสารทั้งหมด | FileText | `/admin/documents` |
| รอตรวจสอบ | Clock | `/admin/documents?status=PENDING` |
| อนุมัติแล้ว | CheckCircle | `/admin/documents?status=APPROVED` |

**Recent Activities** (card):
- รายการ: ชื่อผู้ใช้ + การกระทำ + ชื่อเอกสาร + เวลา
- Verb: อัปโหลดเอกสาร, อนุมัติเอกสาร, ปฏิเสธเอกสาร, ลบเอกสาร

### Documents — `/admin/documents`

**Header:** "เอกสารเครื่องมือวิจัย"

**Status Filter Pills:** ทั้งหมด / รอตรวจสอบ / อนุมัติแล้ว / ปฏิเสธแล้ว
- URL `searchParam` `status` controls filter

**Data Table:**
- คอลัมน์: ลำดับ, ชื่อนักศึกษา (link), รหัสนักศึกษา, ชื่อเครื่องมือวิจัย, ไฟล์ (link PDF), สถานะ (badge), วันที่อัปโหลด, การดำเนินการ

**Actions by status:**
| Status | Buttons |
|---|---|
| PENDING | อนุมัติ (primary) + ปฏิเสธ (outline) + ลบ (destructive) |
| APPROVED | ลบ (destructive) |
| REJECTED | ลบ (destructive) |

**"อนุมัติทั้งหมด" button** — approve ทุกเอกสารที่ PENDING (อันที่ approve ไปแล้วไม่กระทบ)

**Reject Dialog:**
- Modal with textarea for หมายเหตุ/เหตุผล
- Submit → reject document

**Student name link** → `/admin/students` (filtered by that student)

### Students — `/admin/students`

**Header:** "รายชื่อนักศึกษา"

**Data Table:**
- คอลัมน์: ลำดับ, ชื่อ-นามสกุล, รหัสนักศึกษา, หลักสูตร, วิทยานิพนธ์, สถานะนักศึกษา, จำนวนเอกสาร

**สถานะนักศึกษา** (badge):
- กำลังศึกษา → เขียว
- ลาออก → เทา
- พ้นสภาพ → แดง

### Activity Log — `/admin/activity-log`

- ค้นหา + กรองตาม action type / ผู้ใช้
- รายการ: ผู้กระทำ, การกระทำ, เป้าหมาย, เวลา

**Sidebar nav items (Admin):**
- แดชบอร์ด (LayoutDashboard) → `/admin/dashboard`
- เอกสารรอตรวจสอบ (FileText) → `/admin/documents`
- รายชื่อนักศึกษา (Users) → `/admin/students`
- บันทึกกิจกรรม (Activity) → `/admin/activity-log`

---

## Error Pages

| File | Purpose |
|---|---|
| `src/app/global-error.tsx` | Root error boundary |
| `src/app/error.tsx` | App-level error boundary |
| `src/app/unauthorized.tsx` | 401: ไม่มีสิทธิ์เข้าถึง |
| `src/app/forbidden.tsx` | 403: ไม่มีสิทธิ์สำหรับหน้านี้ |
| `src/app/not-found.tsx` | 404 |
