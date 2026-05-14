# UI Pages — Layout & Component Specs

Reference for implementing each page. Based on Lovable UI patterns, converted to Next.js App Router.

---

## Shared Components

### Sidebar (`src/components/sidebar.tsx`)

- Fixed width `w-64`, full height
- Sections: Logo area → Nav links → User footer
- Nav items: icon (Lucide) + label, active state highlight
- User footer: email display + sign-out button
- **Props:** `role: "ADMIN" | "BORROWER"`, `navItems`, `userEmail`
- **Theme:** Orange sidebar for borrower, purple for admin (CSS class on parent layout swaps CSS custom properties)

### Status Badge (`src/components/status-badge.tsx`)

- Pill: `rounded-full px-2.5 py-0.5 text-xs font-medium border`
- Colors use `bg-{token}/15 text-{token} border-{token}/30` pattern
- **Props:** `status: BookingStatus | ToolStatus`

### Stat Card (`src/components/stat-card.tsx`)

- `rounded-xl border bg-card p-5 hover:shadow-md`
- Icon container + value + label
- **Props:** `icon`, `value: number`, `label: string`, `href: string`

### Data Table (`src/components/data-table.tsx`)

- `rounded-xl border bg-card` wrapper with `overflow-x-auto`
- Header: `bg-muted/50`, sticky
- Rows: `border-t` dividers, hover highlight
- **Props:** `columns`, `data`, `actions?`

### Empty State (`src/components/empty-state.tsx`)

- `rounded-lg border border-dashed p-10 text-center text-muted-foreground`
- **Props:** `message: string`, `icon?`

### Filter Pills (`src/components/filter-pills.tsx`)

- Row of `rounded-full px-3 py-1 text-xs border` buttons
- Active: `bg-primary text-primary-foreground border-primary`
- Inactive: `border-input bg-background hover:bg-accent`
- **Props:** `options: string[]`, `selected: string`, `onSelect: (val) => void`
- **Client Component** — uses `useRouter` to update URL `searchParams` on selection

---

## Public Pages

### Landing — `/`

- Full-screen centered layout (no sidebar)
- Microscope icon (h-12, primary color)
- "ToolLend" title (text-4xl, bold)
- Description paragraph (max-w-md, muted)
- Two CTA buttons: "Sign in" (primary) + "Create account" (outline)
- Server-side: redirect to dashboard if authenticated

### Login — `/login`

- Centered card (max-w-md)
- Logo bar: Microscope icon + "ToolLend"
- "Welcome back" heading
- Form: Email input, Password input, Submit button (full-width)
- Footer: "No account? Sign up" link → `/signup`
- Server Action for login, error display inline

### Signup — `/signup`

- Same centered card layout
- "Create your account" heading
- Form: Full name, Email, Department (optional), Password (min 6), Role selector (2-column toggle grid: Borrower / Administrator)
- Submit → Server Action for signup
- Footer: "Already have an account? Sign in" link → `/login`

---

## Borrower Pages (orange theme, borrower sidebar)

### Tool Catalog — `/dashboard`

**Header:** "Tool Catalog" (text-2xl, semibold) + "Browse and request research equipment" (muted)

**Search & Filter Bar** (card container):
- Search input with Search icon — updates URL `searchParam` `q` on submit
- Category filter pills (ALL + dynamic categories) — updates URL `searchParam` `category`
- Status filter pills (ALL, AVAILABLE, BORROWED, MAINTENANCE) — updates URL `searchParam` `status`
- **Implementation:** Server Component reads `searchParams` from page props. Client-side filter pills update URL, triggering server re-render with filtered data.

**Tool Grid** (responsive 1/2/3 col):
- Card: image (aspect-video, fallback Wrench icon), status badge (top-right), title, category (primary), description (line-clamp-2), location + serial meta row
- CTA: "Request to Borrow" (primary, if AVAILABLE) or "Unavailable" (disabled)

**Borrow Request Modal** (Client Component):
- Triggered by "Request to Borrow" click
- Two-column: tool info (left) + form (right)
- Form: Start Date (calendar), End Date (calendar), Purpose (textarea)
- Validation: both dates required, end >= start, purpose non-empty
- Submit → Server Action `createBooking`
- Success → toast + close modal + `revalidatePath`

### My Bookings — `/my-bookings`

**Header:** "My Bookings" + "Track your requests and active loans"

**Tab Bar:** Current (APPROVED + OVERDUE) / Pending / Past (RETURNED + REJECTED)
- Active tab: border-bottom underline, count badge
- **Implementation:** URL `searchParam` `tab` controls active tab. Server Component pre-filters bookings by tab.

**Booking Cards:**
- Left: 96x96px thumbnail
- Right: tool name, category, status badge, date range, purpose, admin notes (if any)
- Actions: PENDING → "Cancel request" button → Server Action `cancelBooking`
- Dates displayed as formatted strings (serialized from Server Component)

---

## Admin Pages (purple theme, admin sidebar)

### Dashboard — `/admin/dashboard`

**Header:** "Dashboard" + "Admin overview of the equipment library"

**Stat Cards** (4-card grid, responsive 1/2/4 col):
| Label | Icon | Link |
|---|---|---|
| Total Tools | Wrench | `/admin/inventory` |
| Currently Borrowed | PackageCheck | `/admin/inventory` |
| Pending Requests | Clock | `/admin/requests` |
| Overdue Returns | AlertTriangle | `/admin/requests` |

**Recent Activities** (card):
- Header: "Recent Activities"
- List: borrower name + verb + tool name + timestamp
- Verb mapping: PENDING→"requested", APPROVED→"was approved for", REJECTED→"was rejected for", RETURNED→"returned", OVERDUE→"is overdue for"

### Inventory — `/admin/inventory`

**Header:** "Inventory" + "Add New Tool" button (primary, Plus icon)

**Data Table:**
- Columns: Image, Name (+ category), Serial #, Status (badge), Location, Actions
- Actions: Edit (Pencil), Toggle status (MAINTENANCE ↔ AVAILABLE), Deactivate (Trash2, with confirm — soft delete; hard delete only if tool has zero bookings)

**Tool Form Modal** (create/edit):
- Fields: Name, Description (textarea), Category, Serial Number, Image URL, Location, Status (select)
- Two-column grid for paired fields
- Submit → Server Action `createTool` or `updateTool`

### Requests — `/admin/requests`

**Header:** "Borrowing Requests" + "Approve, reject and track returns"

**Status Filter Pills:** ALL, PENDING, APPROVED, REJECTED, RETURNED, OVERDUE
- **Implementation:** Same URL `searchParam` pattern as tool catalog filters.

**Data Table:**
- Columns: Borrower (name + dept), Tool, Dates, Purpose (line-clamp-2), Status (badge), Actions

**Actions by status:**
| Status | Buttons |
|---|---|
| PENDING | Approve (primary) + Reject (outline) — opens notes dialog |
| APPROVED | Mark Returned (primary) + Flag Overdue (outline) |
| OVERDUE | Mark Returned (primary) |

**Admin Notes Dialog:**
- Modal with textarea for optional notes
- NOT `window.prompt()` — use a shadcn/ui Dialog component
- Submit → Server Action `approveBooking` or `rejectBooking`

### Users — `/admin/users`

**Header:** "Users" + "Registered accounts"

**Data Table (read-only):**
- Columns: Name, Email, Department, Role

---

## Error & Loading States

| File | Purpose |
|---|---|
| `src/app/global-error.tsx` | Root error boundary: catches layout errors, must include `<html>` + `<body>` |
| `src/app/error.tsx` | App-level error boundary: "Something went wrong" + message + retry button |
| `src/app/unauthorized.tsx` | 401: "Please sign in to continue" + link to `/login` |
| `src/app/forbidden.tsx` | 403: "You don't have access to this page" + link to correct dashboard |
| `src/app/not-found.tsx` | 404: centered "404" (text-7xl) + "Page not found" + "Go home" link |
| `loading.tsx` (per segment) | Skeleton placeholder matching the page layout |

All error boundary files are Client Components (`"use client"`).

---

## Toast Notifications

- Library: `sonner` (shadcn/ui integration)
- Position: top-right
- Use after all mutations: `toast.success(...)`, `toast.error(...)`
- Client-side only — call from Client Components after Server Action results
