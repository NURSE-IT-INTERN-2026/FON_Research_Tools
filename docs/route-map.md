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
├── unauthorized.tsx              ← 401 page (unauthenticated on protected route)
├── forbidden.tsx                 ← 403 page (wrong role)
├── not-found.tsx                 ← 404 page
├── error.tsx                     ← Error boundary (client component)
├── global-error.tsx              ← Root error boundary (catches layout errors)
├── (borrower)/                   ← Route group: borrower layout + auth guard
│   ├── layout.tsx                ← Sidebar (orange theme) + main content
│   ├── dashboard/
│   │   └── page.tsx              ← Tool catalog (browse, search, filter, request)
│   └── my-bookings/
│       └── page.tsx              ← Booking tracker (Current / Pending / Past tabs)
└── (admin)/                      ← Route group: admin layout + auth guard
    ├── layout.tsx                ← Sidebar (purple theme) + main content
    ├── dashboard/
    │   └── page.tsx              ← Stat cards + recent activity
    ├── inventory/
    │   └── page.tsx              ← Tool CRUD table
    ├── requests/
    │   └── page.tsx              ← Borrow request management
    └── users/
        └── page.tsx              ← Read-only user list
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
| `/dashboard` | Tool catalog | `tools` table, filtered/searched via URL `searchParams` (server-side) |
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

- **Proxy** (`proxy.ts`): runs on every request, refreshes Supabase session cookie, redirects unauthenticated users to `/login`, redirects wrong-role users to their correct dashboard. Uses Next.js 16 `proxy()` export (not `middleware()`).
- **Layout guards**: `(borrower)/layout.tsx` and `(admin)/layout.tsx` call `requireRole()` server-side and render the appropriate sidebar. Proxy handles coarse redirect; layouts render role-specific UI.
- **Server Components**: fetch data server-side using the session — no client-side auth flashing.
- **Auth errors**: use `unauthorized()` (renders `unauthorized.tsx`) and `forbidden()` (renders `forbidden.tsx`) from `next/navigation` where applicable.

---

## API / Server Actions

All mutations use Next.js Server Actions, not API routes.

| Action | Trigger | Mutations |
|---|---|---|
| `signup` | Signup form submit | Supabase `signUp` → trigger creates Profile + UserRole → redirect by role |
| `login` | Login form submit | Supabase `signInWithPassword` → query role → redirect by role |
| `signOut` | Sidebar sign-out button | Supabase `signOut` → redirect to `/` |
| `createBooking` | Borrower submits request form | Insert `bookings` row (status: PENDING) |
| `cancelBooking` | Borrower cancels pending request | Update `bookings` status → REJECTED |
| `createTool` | Admin adds new tool | Insert `tools` row |
| `updateTool` | Admin edits tool | Update `tools` row |
| `deactivateTool` | Admin deactivates tool | Set `tools.isActive` → false (soft delete; hard delete only if tool has zero bookings) |
| `toggleToolStatus` | Admin toggles maintenance | Update `tools` status |
| `approveBooking` | Admin approves request | Update `bookings` → APPROVED; Update `tools` → BORROWED |
| `rejectBooking` | Admin rejects request | Update `bookings` → REJECTED + adminNotes |
| `markReturned` | Admin marks returned | Update `bookings` → RETURNED, set `returnDate`; Update `tools` → AVAILABLE (if no other APPROVED bookings) |
| `markOverdue` | Admin flags overdue | Update `bookings` → OVERDUE |

---

## Naming Conventions

- Route groups use parentheses: `(borrower)`, `(admin)`
- Page files are always `page.tsx`
- Layout files are always `layout.tsx`
- Error boundaries are `error.tsx` (add per-segment as needed)
- Loading states are `loading.tsx` (add per-segment as needed)
- Route protection uses `proxy.ts` with `export function proxy()` (Next.js 16+)
