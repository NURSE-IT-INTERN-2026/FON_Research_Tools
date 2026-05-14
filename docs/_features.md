# Feature Breakdown for AI Implementation

**AI Instruction:** This document breaks down the project into isolated, implementable features. When requested to build a specific feature, focus ONLY on the components, API routes, and logic required for that feature.

---

## 🛠️ Phase 1: Foundation & Data Layer

### Feature 1: Database Schema & Models
*   **Description:** Setup Prisma schema with core models and relationships.
*   **Models Required:**
    *   `User`: id, name, email, role (Enum: ADMIN, BORROWER).
    *   `Tool`: id, name, description, category, serialNumber, imageUrl, status (Enum: AVAILABLE, BORROWED, MAINTENANCE).
    *   `Booking`: id, userId, toolId, startDate, endDate, purpose, status (Enum: PENDING, APPROVED, REJECTED, RETURNED, OVERDUE), adminNotes.
*   **Expected Output:** `schema.prisma` file and a basic seed script with mock data.

### Feature 2: Authentication & Role Routing
*   **Description:** Basic login flow and role-based redirects.
*   **Requirements:**
    *   Login page (`/login`).
    *   If user role is `ADMIN`, redirect to `/admin/dashboard`.
    *   If user role is `BORROWER`, redirect to `/dashboard`.
    *   Middleware or layout protection to prevent Borrowers from accessing `/admin` routes.

---

## 🟠 Phase 2: Borrower Portal (Theme: #f26e2c)

### Feature 3: Borrower - Tool Catalog (Dashboard)
*   **Path:** `/dashboard`
*   **Description:** The main landing page for borrowers to browse tools.
*   **UI Components:**
    *   Search bar (search by name or serial number).
    *   Filters (by Category, by Status).
    *   Tool Grid/List showing cards with `imageUrl`, `name`, and colored `status` badges.

### Feature 4: Borrower - Borrowing Request Flow
*   **Path:** `/dashboard` (Modal or dynamic route `/dashboard/tool/[id]`)
*   **Description:** The action of requesting a tool.
*   **UI Components & Logic:**
    *   When clicking "Request" on a tool card, open a form.
    *   Form fields: `startDate` (Date picker), `endDate` (Date picker), `purpose` (Textarea).
    *   Action: Submit button creates a new `Booking` record with status `PENDING`.
    *   Validation: Cannot select past dates.

### Feature 5: Borrower - My Bookings
*   **Path:** `/dashboard/my-bookings`
*   **Description:** History and status tracking for the logged-in user.
*   **UI Components & Logic:**
    *   Data table or list displaying the user's bookings.
    *   Columns: Tool Name, Borrow Dates, Purpose, Status Badge.
    *   Tabs to filter view: "Active Requests", "Past History".

---

## 🟣 Phase 3: Admin Portal (Theme: #aa74ab)

### Feature 6: Admin - Dashboard Overview
*   **Path:** `/admin/dashboard`
*   **Description:** High-level metrics for lab managers.
*   **UI Components:**
    *   4 Metric Cards: Total Tools, Currently Borrowed, Pending Requests, Overdue Returns.
    *   Recent Activity List (e.g., latest 5 pending requests).

### Feature 7: Admin - Inventory Management (CRUD)
*   **Path:** `/admin/inventory`
*   **Description:** Manage the list of physical tools.
*   **UI Components & Logic:**
    *   Data table of all tools.
    *   "Add New Tool" button -> opens modal/form to create a tool.
    *   "Edit" button -> update tool details (e.g., change status manually to `MAINTENANCE` if broken).
    *   "Delete/Archive" functionality.

### Feature 8: Admin - Request Approval Workflow
*   **Path:** `/admin/requests`
*   **Description:** Screen to manage `PENDING` booking requests.
*   **UI Components & Logic:**
    *   List of pending requests showing Borrower Name, Tool, Dates, and Purpose.
    *   **Approve Button:** Changes Booking status to `APPROVED` AND changes Tool status to `BORROWED`.
    *   **Reject Button:** Opens a prompt to input `adminNotes` (reason for rejection), then changes Booking status to `REJECTED`.

### Feature 9: Admin - Return & Tracking System
*   **Path:** `/admin/returns`
*   **Description:** Manage active borrowings and process returns.
*   **UI Components & Logic:**
    *   List of bookings with status `APPROVED` (currently borrowed).
    *   Highlight logic: If `endDate` is past today, show badge as `OVERDUE`.
    *   **Mark as Returned Button:** Changes Booking status to `RETURNED` AND changes Tool status back to `AVAILABLE`.