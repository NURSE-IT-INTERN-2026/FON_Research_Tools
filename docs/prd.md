# Product Requirements Document

## Project Name

Research Tools — Equipment Lending Management System

## 1. Problem

Research institutions manage shared equipment (microscopes, oscilloscopes, 3D printers, etc.) through paper forms and spreadsheets. This leads to lost equipment, scheduling conflicts, and no visibility into availability.

## 2. Solution

A web application where:
- **Borrowers** browse a tool catalog, submit borrow requests, and track their bookings.
- **Admins** manage the inventory, approve/reject requests, process returns, and track overdue items.

All online, no paper.

## 3. Technical Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| UI | React 19, Tailwind CSS v4, shadcn/ui |
| Database | PostgreSQL |
| ORM | Prisma 7 |
| Deployment | Docker Compose (local dev) |

## 4. User Roles

| Role | Description |
|---|---|
| **Borrower** | Students, researchers, staff who browse and request equipment |
| **Admin** | Lab managers who manage inventory and approve requests |

## 5. Design System

| Context | Primary Color | Purpose |
|---|---|---|
| Borrower UI | Orange `#f26e2c` | Clean, user-centric browsing experience |
| Admin UI | Purple `#aa74ab` | Data-dense management interface |
| Shared | Slate base, system fonts | Neutral foundation |

Both themes share the same background, card, border, and status colors. Only the primary/accent/sidebar tokens change.

## 6. Core Features (MVP)

### 6.1 Authentication
- Email/password signup with role selection (Borrower or Admin)
- Email/password login with role-based redirect
- Session management with server-side protection

### 6.2 Borrower Portal
- **Tool Catalog** (`/dashboard`) — Browse, search, filter by category/status, request to borrow
- **My Bookings** (`/dashboard/my-bookings`) — Track bookings by tab (Current / Pending / Past), cancel pending requests

### 6.3 Admin Portal
- **Dashboard** (`/admin/dashboard`) — Stat cards (total tools, borrowed, pending, overdue) + recent activity feed
- **Inventory** (`/admin/inventory`) — CRUD table for tools (add, edit, delete, toggle status)
- **Requests** (`/admin/requests`) — Approve/reject borrow requests, mark returns, flag overdue
- **Users** (`/admin/users`) — Read-only list of registered accounts

### 6.4 Booking Lifecycle
- Borrower submits request → status: `PENDING`
- Admin approves → status: `APPROVED`, tool status: `BORROWED`
- Admin rejects → status: `REJECTED`, optional notes
- Admin marks returned → status: `RETURNED`, tool status: `AVAILABLE`
- System flags overdue → status: `OVERDUE`

## 7. Out of Scope (Post-MVP)

- File/image upload for tools (use URL field for now)
- Email notifications
- Pagination (load all for MVP)
- Mobile responsive sidebar
- Optimistic UI updates
- Real-time updates (WebSockets)
- Calendar/scheduling view
- Audit log
