# Route Map

All routes use Next.js App Router (`src/app/`).

---

## Route Tree

```
src/app/
├── layout.tsx                    ← Root layout (html, body, fonts, providers)
├── page.tsx                      ← Landing page (redirect if authenticated)
├── login/
│   └── page.tsx                  ← Sign in
├── signup/
│   └── page.tsx                  ← Register with role selection
├── (borrower)/                   ← Route group: borrower layout + auth guard
│   ├── layout.tsx                ← Sidebar (orange theme) + main content
│   ├── dashboard/
│   │   └── page.tsx              ← Tool catalog (browse, search, filter, request)
│   └── my-bookings/
│       └── page.tsx              ← Booking tracker (Current / Pending / Past tabs)
├── (admin)/                      ← Route group: admin layout + auth guard
│   ├── layout.tsx                ← Sidebar (purple theme) + main content
│   ├── dashboard/
│   │   └── page.tsx              ← Stat cards + recent activity
│   ├── inventory/
│   │   └── page.tsx              ← Tool CRUD table
│   ├── requests/
│   │   └── page.tsx              ← Borrow request management
│   └── users/
│       └── page.tsx              ← Read-only user list
├── not-found.tsx                 ← 404
└── error.tsx                     ← Global error boundary
```

---

## Route Details

### Public Routes

| Route | Page | Auth | Data |
|---|---|---|---|
| `/` | Landing | Redirect if logged in | None |
| `/login` | Sign in | Redirect if logged in | None |
| `/signup` | Register | Redirect if logged in | None |

### Borrower Routes (requires `BORROWER` role)

| Route | Page | Data Source |
|---|---|---|
| `/dashboard` | Tool catalog | `tools` table, filtered/searched server-side |
| `/my-bookings` | Booking tracker | `bookings` + `tools` join, filtered by `user_id` |

### Admin Routes (requires `ADMIN` role)

| Route | Page | Data Source |
|---|---|---|
| `/admin/dashboard` | Stats + activity | Aggregate counts on `tools` + `bookings`; recent `bookings` + `profiles` join |
| `/admin/inventory` | Tool CRUD | `tools` table, ordered by name |
| `/admin/requests` | Request management | `bookings` + `tools` + `profiles` join |
| `/admin/users` | User list | `profiles` + `user_roles` join |

---

## Auth & Guard Strategy

- **Middleware** (`middleware.ts`): runs on every request, checks session cookie, redirects unauthenticated users to `/login`, redirects wrong-role users to their correct dashboard.
- **Layout guards**: `(borrower)/layout.tsx` and `(admin)/layout.tsx` verify the role server-side and render the appropriate sidebar.
- **Server Components**: fetch data server-side using the session — no client-side auth flashing.

---

## API / Server Actions

All mutations use Next.js Server Actions, not API routes.

| Action | Trigger | Mutations |
|---|---|---|
| `createBooking` | Borrower submits request form | Insert `bookings` row (status: PENDING) |
| `cancelBooking` | Borrower cancels pending request | Update `bookings` status → REJECTED |
| `requestReturn` | Borrower requests return | Update `bookings` admin_notes |
| `createTool` | Admin adds new tool | Insert `tools` row |
| `updateTool` | Admin edits tool | Update `tools` row |
| `deleteTool` | Admin deletes tool | Delete `tools` row |
| `toggleToolStatus` | Admin toggles maintenance | Update `tools` status |
| `approveBooking` | Admin approves request | Update `bookings` → APPROVED; Update `tools` → BORROWED |
| `rejectBooking` | Admin rejects request | Update `bookings` → REJECTED + notes |
| `markReturned` | Admin marks returned | Update `bookings` → RETURNED; Update `tools` → AVAILABLE (if no other active bookings) |
| `markOverdue` | Admin flags overdue | Update `bookings` → OVERDUE |

---

## Naming Conventions

- Route groups use parentheses: `(borrower)`, `(admin)`
- Page files are always `page.tsx`
- Layout files are always `layout.tsx`
- Error boundaries are `error.tsx` (add per-segment as needed)
- Loading states are `loading.tsx` (add per-segment as needed)
