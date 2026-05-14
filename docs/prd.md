# Product Requirements Document (PRD)

## Project Name
Research Tools Management System (ระบบบริหารจัดการยืม-คืนเครื่องมือเพื่องานวิจัย)

## 1. Project Overview
พัฒนาระบบดิจิทัลแบบครบวงจรเพื่อบริหารจัดการการยืม-คืนเครื่องมือเพื่องานวิจัย ตั้งแต่การจัดทำฐานข้อมูลคลังอุปกรณ์ การส่งคำขอยืม การพิจารณาอนุมัติ การบันทึกรับ-คืน และการติดตามสถานะเครื่องมือ ผ่านระบบออนไลน์ทั้งหมด เพื่อลดการใช้เอกสารและ Excel ในการบันทึกข้อมูล พร้อมป้องกันปัญหาอุปกรณ์สูญหายหรือตกหล่น โดยนักศึกษาและนักวิจัยสามารถสืบค้นข้อมูลเครื่องมือ ตรวจสอบสถานะความพร้อม จองคิวใช้งาน และติดตามประวัติการยืม-คืนของตนเองได้ด้วยตนเองผ่านระบบออนไลน์

## 2. Technical Stack
**AI Instruction:** Always enforce these technologies when generating or refactoring code.
- **Framework:** Next.js 16 (App Router)
- **UI Library:** React, Tailwind CSS, shadcn/ui
- **Database:** PostgreSQL
- **ORM:** Prisma 7
- **Deployment & Infra:** Docker Compose for local database setup

## 3. User Roles
The system supports two main roles:
1. **Borrower (ผู้ยืม):** Students, researchers, or staff who need to borrow equipment.
2. **Admin (ผู้ดูแลระบบ):** Lab managers or staff responsible for managing the inventory and approving requests.

## 4. Design System & Theme
- **Borrower UI:** Primary accent color is Orange (`#f26e2c`). Clean, accessible, and user-centric.
- **Admin UI:** Primary accent color is Purple (`#aa74ab`). Data-dense, analytical, and management-focused.

## 5. AI Assistant Rules
- ALWAYS check `docs/feature.md` before implementing a new feature.
- Follow Next.js App Router best practices (Server Components by default, Client Components only when hooks are needed).
- Ensure database schema updates are strictly reflected in `schema.prisma`.