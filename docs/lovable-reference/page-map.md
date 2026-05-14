# Page Map — Lovable Reference Project

> Detailed breakdown of every page, its UI elements, interactions, and data dependencies.

---

## 1. Landing Page — `/`

**File:** `src/routes/index.tsx`
**Auth:** Redirects authenticated users to their dashboard

### Layout
- Full-screen centered layout (no sidebar)
- `Microscope` icon (h-12, primary color)
- App title: "ToolLend" (text-4xl, bold)
- Description paragraph (max-w-md, muted)
- Two CTA buttons: "Sign in" (primary bg) + "Create account" (card bg, border)

### Behavior
- On mount: if user is ADMIN → redirect `/admin/dashboard`; if BORROWER → redirect `/dashboard`
- No data fetching

---

## 2. Login — `/login`

**File:** `src/routes/login.tsx`
**Auth:** Skips entirely if `VITE_DEV_BYPASS_AUTH` is set

### Layout
- Full-screen centered card (max-w-md)
- Logo bar: `Microscope` icon + "ToolLend" text
- Card with: "Welcome back" heading, subtitle, form
- Form fields: Email (type=email), Password (type=password)
- Submit button (full-width, primary)
- Footer: "No account? Sign up" link

### Interactions
- Submit: `supabase.auth.signInWithPassword` → query `user_roles` → redirect by role
- Error toast on failure
- "No role" edge case: toast error, sign out

---

## 3. Signup — `/signup`

**File:** `src/routes/signup.tsx`
**Auth:** Skips entirely if `VITE_DEV_BYPASS_AUTH` is set

### Layout
- Same centered card layout as login
- Card with: "Create your account" heading, subtitle, form
- Form fields: Full name, Email, Department (optional, placeholder "e.g. Physics"), Password (min 6)
- Role selector: 2-column grid of toggle buttons (Borrower / Administrator)
- Submit button (full-width, primary)
- Footer: "Already have an account? Sign in" link

### Interactions
- Submit: `supabase.auth.signUp` with metadata `{ name, department, role }`
- `handle_new_user` trigger creates profile + user_role
- If session returned immediately → redirect; otherwise → redirect to login with "check email" toast

---

## 4. Browse Tools (Borrower) — `/dashboard`

**File:** `src/routes/dashboard.tsx`
**Auth:** Requires BORROWER role (RoleGuard)
**Layout:** AppLayout with Borrower sidebar

### Page Header
- "Tool Catalog" (text-2xl, semibold)
- "Browse and request research equipment" (muted)

### Search & Filter Bar
- Card container (rounded-xl, bordered)
- Search input with `Search` icon (left-aligned, placeholder "Search by tool name, category, or description...")
- Category filter: pill buttons (ALL + dynamic categories from data)
- Status filter: pill buttons (ALL, AVAILABLE, BORROWED, MAINTENANCE)
- Active pill: `bg-primary text-primary-foreground`
- Inactive pill: `border-input bg-background hover:bg-accent`

### Tool Grid
- Responsive: 1 col (mobile), 2 col (sm), 3 col (lg)
- Each card: `rounded-xl border border-border bg-card`
  - Image area: aspect-video with object-cover, fallback `Wrench` icon
  - Status badge: absolute top-right, pill with backdrop blur
  - Title (font-semibold), Category (text-primary, font-medium)
  - Description (line-clamp-2, muted)
  - Meta row: Location (MapPin icon) + Serial # (Hash icon)
  - CTA button: "Request to Borrow" (primary) or "Unavailable" (disabled) based on status

### Request Modal
- Fixed overlay with dark backdrop (`bg-black/60`)
- Modal card: max-w-2xl, two-column layout
  - Left: Tool image, name, category, description, location, serial
  - Right: Form with date pickers (Calendar popover) + purpose textarea
- Date pickers: `Popover` + `Calendar` component, disabled before today
- Validation: requires both dates, end >= start, non-empty purpose
- Footer: Cancel (outline) + Confirm Request (primary)

### Data Source
- Supabase `tools` table (ordered by name)
- Mock: `mockTools` array (6 items) when `isDevBypass`

---

## 5. My Bookings (Borrower) — `/dashboard/my-bookings`

**File:** `src/routes/dashboard.my-bookings.tsx`
**Auth:** Requires BORROWER role
**Layout:** AppLayout with Borrower sidebar

### Page Header
- "My Bookings" (text-2xl, semibold)
- "Track your requests and active loans" (muted)

### Tab Bar
- Three tabs: Current, Pending, Past
- Active tab: `border-primary text-primary` underline
- Each tab shows count badge (rounded-full pill)
- Grouping logic:
  - Current: APPROVED + OVERDUE
  - Pending: PENDING
  - Past: RETURNED + REJECTED

### Booking Cards
- Each card: `bg-card border border-border rounded-xl p-4`, hover highlight
- Left: 96x96px thumbnail (rounded-lg, object-cover)
- Right: Tool name (semibold), Category (primary, font-medium), Status badge (pill)
- Date row: Calendar icon + "start_date → end_date"
- Purpose text
- Admin notes (italic, muted) — if present
- Action buttons:
  - PENDING → "Cancel request" (outline button)
  - APPROVED/OVERDUE → "Request Return" (primary button)

### Status Badge Colors
| Status | Style |
|---|---|
| PENDING | `bg-primary/15 text-primary border-primary/30` |
| APPROVED | `bg-success/15 text-success border-success/30` |
| REJECTED | `bg-destructive/15 text-destructive border-destructive/30` |
| RETURNED | `bg-muted text-muted-foreground border-border` |
| OVERDUE | `bg-destructive/15 text-destructive border-destructive/30` |

### Data Source
- Supabase `bookings` with join `tools(name, category, image_url)`, filtered by `user_id`
- Mock: `mockBorrowerBookings` (5 items)

---

## 6. Admin Dashboard — `/admin/dashboard`

**File:** `src/routes/admin.dashboard.tsx`
**Auth:** Requires ADMIN role
**Layout:** AppLayout with Admin sidebar (purple theme)

### Page Header
- "Dashboard" (text-2xl, semibold)
- "Admin overview of the equipment library" (muted)

### Stat Cards (4 cards, responsive grid: 1/2/4 col)
Each card: `rounded-xl border bg-card p-5 hover:shadow-md`, links to relevant page

| Label | Icon | Color | Link |
|---|---|---|---|
| Total Tools | Wrench | `bg-primary/10 text-primary` | /admin/inventory |
| Currently Borrowed | PackageCheck | same | /admin/inventory |
| Pending Requests | Clock | same | /admin/requests |
| Overdue Returns | AlertTriangle | same | /admin/requests |

### Recent Activities
- Card: `rounded-xl border bg-card`
- Header: "Recent Activities" (font-semibold)
- List: divided rows with borrower name (font-medium) + verb + tool name + timestamp
- Verb mapping: PENDING→"requested", APPROVED→"was approved for", REJECTED→"was rejected for", RETURNED→"returned", OVERDUE→"is overdue for"

### Data Source
- Stats: 4 parallel Supabase count queries (tools total, tools BORROWED, bookings PENDING, bookings OVERDUE)
- Activities: Recent bookings joined with tools + profiles
- Mock: `mockAdminStats` + `mockAdminActivities` (4 items)

---

## 7. Admin Inventory — `/admin/inventory`

**File:** `src/routes/admin.inventory.tsx`
**Auth:** Requires ADMIN role
**Layout:** AppLayout with Admin sidebar

### Page Header
- "Inventory" (text-2xl, semibold) + subtitle
- "Add New Tool" button (primary, with Plus icon) — top-right

### Data Table
- `rounded-xl border bg-card` wrapper
- Columns: Image, Name (+ category subtitle), Serial #, Status (badge), Location, Actions
- Status badge colors (same pattern as tool catalog)
- Actions per row:
  - Edit (Pencil icon) → opens edit modal
  - Change Status → toggles between MAINTENANCE and AVAILABLE
  - Delete (Trash2 icon, destructive text) → confirm dialog

### Tool Form Modal (Create / Edit)
- Same overlay pattern as request modal
- Fields: Name, Description (textarea), Category, Serial Number, Image URL (+ disabled "Upload (soon)" button), Location, Status (select dropdown)
- Two-column grid for: Category + Serial, Location + Status
- Footer: Cancel + Save/Add tool

### Tool Status Badge Colors
| Status | Style |
|---|---|
| AVAILABLE | `bg-success/15 text-success border-success/30` |
| BORROWED | `bg-primary/15 text-primary border-primary/30` |
| MAINTENANCE | `bg-muted text-muted-foreground border-border` |

### Data Source
- Supabase `tools` table (ordered by name)
- Mock: `mockTools` (6 items), CRUD operations modify local state

---

## 8. Admin Requests — `/admin/requests`

**File:** `src/routes/admin.requests.tsx`
**Auth:** Requires ADMIN role
**Layout:** AppLayout with Admin sidebar

### Page Header
- "Borrowing Requests" (text-2xl, semibold)
- "Approve, reject and track returns" (muted)

### Status Filter Bar
- Pill buttons: ALL, PENDING, APPROVED, REJECTED, RETURNED, OVERDUE
- Active: `bg-primary text-primary-foreground`
- Inactive: `border-input bg-card hover:bg-accent`

### Data Table
- Columns: Borrower (name + department), Tool, Dates (→ format), Purpose (line-clamp-2), Status (badge), Actions

### Status Badge Colors (Admin variant — PENDING uses warning)
| Status | Style |
|---|---|
| PENDING | `bg-warning/15 text-warning-foreground border-warning/40` |
| APPROVED | `bg-success/15 text-success border-success/30` |
| REJECTED | `bg-destructive/15 text-destructive border-destructive/30` |
| RETURNED | `bg-muted text-muted-foreground border-border` |
| OVERDUE | `bg-destructive/15 text-destructive border-destructive/30` |

### Actions per Status
| Status | Buttons |
|---|---|
| PENDING | Approve (primary, Check icon) + Reject (outline, X icon) — both prompt for optional note |
| APPROVED | "Mark returned" (primary) + "Overdue" (outline) |
| OVERDUE | "Mark returned" (primary) |

### Side Effects on Status Change
- APPROVE: also sets tool status to BORROWED
- RETURNED/REJECTED: checks if other APPROVED bookings exist for that tool; if not, sets tool status to AVAILABLE

### Data Source
- Supabase `bookings` joined with `tools(name)` + profiles lookup
- Mock: `mockAdminRequests` (5 items)
- Note: Uses `prompt()` for admin notes — **crude, needs proper dialog in rewrite**

---

## 9. Admin Users — `/admin/users`

**File:** `src/routes/admin.users.tsx`
**Auth:** Requires ADMIN role
**Layout:** AppLayout with Admin sidebar

### Page Header
- "Users" (text-2xl, semibold)
- "Registered accounts" (muted)

### Data Table (read-only)
- Columns: Name, Email, Department, Role
- Simple bordered table with muted/50 header bg

### Data Source
- Two queries: `profiles` + `user_roles`, merged in client
- Mock: `mockUsers` (6 items)

---

## 404 Page
- Full-bleed centered: "404" (text-7xl, bold) + "Page not found." + "Go home" link

## Error Page
- Full-bleed centered: "Something went wrong" + error message + "Try again" button
