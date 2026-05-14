# Design Inventory — Lovable Reference Project

> **Purpose:** High-level summary of the Lovable-generated ToolLend app.
> This document describes WHAT exists. It is not a spec for the rewrite.

---

## App Identity

- **Name:** ToolLend — Research Tool Lending
- **Tagline:** "Reserve microscopes, oscilloscopes, 3D printers, and more from your research institution's shared equipment library."
- **Icon:** `Microscope` (Lucide)
- **Domain:** Research equipment lending / shared tool library for academic institutions

---

## Tech Stack (Lovable-original)

| Layer | Technology |
|---|---|
| Framework | TanStack Start (SSR) + TanStack Router |
| Build | Vite 7 + Cloudflare adapter |
| UI Library | shadcn/ui (new-york style, slate base, Tailwind v4) |
| State / Fetching | TanStack React Query + local useState |
| Auth | Supabase Auth (email/password) |
| Database | Supabase Postgres with RLS |
| Forms | Uncontrolled (plain onChange handlers, no react-hook-form in actual pages) |
| Notifications | Sonner (toast) |
| Date handling | date-fns |
| Charts | recharts (installed but not used in any page) |

---

## Roles

| Role | Description |
|---|---|
| `ADMIN` | Manages inventory, approves/rejects borrowing requests, manages users |
| `BORROWER` | Browses tool catalog, submits borrow requests, tracks own bookings |

---

## Routes (9 total)

### Public
| Path | File | Description |
|---|---|---|
| `/` | `routes/index.tsx` | Landing page — auto-redirects if authenticated |
| `/login` | `routes/login.tsx` | Email/password sign-in |
| `/signup` | `routes/signup.tsx` | Registration with role selection |

### Borrower (requires `BORROWER` role)
| Path | File | Description |
|---|---|---|
| `/dashboard` | `routes/dashboard.tsx` | Tool catalog — browse, filter, request to borrow |
| `/dashboard/my-bookings` | `routes/dashboard.my-bookings.tsx` | Booking tracker with tabs (Current / Pending / Past) |

### Admin (requires `ADMIN` role)
| Path | File | Description |
|---|---|---|
| `/admin/dashboard` | `routes/admin.dashboard.tsx` | Overview: stat cards + recent activity feed |
| `/admin/inventory` | `routes/admin.inventory.tsx` | CRUD table for tools (add / edit / delete / status toggle) |
| `/admin/requests` | `routes/admin.requests.tsx` | Manage borrowing requests (approve / reject / mark returned / overdue) |
| `/admin/users` | `routes/admin.users.tsx` | Read-only user list |

---

## Layout Structure

```
__root.tsx (RootShell — full <html>, QueryClientProvider, AuthProvider, Toaster)
├── Public pages (full-bleed centered card — no sidebar)
│   ├── /
│   ├── /login
│   └── /signup
└── AppLayout pages (sidebar + main content)
    ├── Borrower sidebar (orange theme)
    │   ├── /dashboard
    │   └── /dashboard/my-bookings
    └── Admin sidebar (purple theme)
        ├── /admin/dashboard
        ├── /admin/inventory
        ├── /admin/requests
        └── /admin/users
```

### Sidebar (AppLayout)

- Fixed-width: `w-64`
- Top: Logo + app name + role subtitle ("Admin Console" / "Researcher Portal")
- Middle: Navigation links (icon + label), active state highlight
- Bottom: Dev role switcher (visible only in dev bypass mode), user email, sign-out button
- Admin sidebar uses purple color scheme
- Borrower sidebar uses orange color scheme

---

## Data Model (from Supabase)

### Enums
- `app_role`: `ADMIN` | `BORROWER`
- `tool_status`: `AVAILABLE` | `BORROWED` | `MAINTENANCE`
- `booking_status`: `PENDING` | `APPROVED` | `REJECTED` | `RETURNED` | `OVERDUE`

### Tables

| Table | Key Columns | Notes |
|---|---|---|
| `profiles` | id (UUID FK→auth.users), name, email, department | Auto-created on signup via trigger |
| `user_roles` | id, user_id (FK→auth.users), role (app_role) | UNIQUE(user_id, role); created on signup from metadata |
| `tools` | id, name, description, category, serial_number, image_url, status, location | Admin-managed catalog |
| `bookings` | id, user_id, tool_id, start_date, end_date, purpose, status, admin_notes | FK→tools, FK→auth.users |

### RLS Policies
- Profiles: readable by authenticated; users can insert/update own
- User roles: users read own; admins can manage all; users insert own on signup
- Tools: readable by authenticated; admins have full CRUD
- Bookings: users read own OR admin reads all; borrowers create own; admins update all; users delete own pending

### Server Functions
- `has_role(_user_id, _role)` → boolean — SECURITY DEFINER, used in RLS
- `handle_new_user()` → trigger — auto-creates profile + user_role from signup metadata

---

## Authentication Flow

1. **Signup:** User picks role (BORROWER/ADMIN) on the form. Role stored in `raw_user_meta_data`. `handle_new_user` trigger creates `profiles` row + `user_roles` row.
2. **Login:** Supabase `signInWithPassword` → query `user_roles` → redirect based on role.
3. **Session:** `onAuthStateChange` listener keeps React state in sync.
4. **Role Guard:** `RoleGuard` component redirects unauthenticated users to `/login` and wrong-role users to their correct dashboard.
5. **Dev Bypass:** `VITE_DEV_BYPASS_AUTH` env var skips real auth entirely, uses mock user objects with localStorage role switching.

---

## Dev Bypass System (MOCK DATA — flag for migration)

Every page checks `isDevBypass` from `useAuth()`:
- If `true` → loads data from `src/lib/mock-data.ts` instead of Supabase
- Mock data includes: 6 tools, 5 borrower bookings, admin stats, 4 activities, 5 admin requests, 6 users
- CRUD operations in mock mode update local state only (no persistence)
- All mock IDs use patterns like `tool-1`, `user-1`, `booking-1`, `request-1`, `activity-1`
- Mock emails use `@local.test` and `@example.edu` domains

---

## Key UI Patterns

| Pattern | Where Used |
|---|---|
| Stat cards (icon + value + label) | Admin dashboard |
| Data table (bordered, rounded-xl) | Inventory, Requests, Users |
| Card grid (responsive 1/2/3 col) | Tool catalog |
| Modal overlays (fixed backdrop + centered card) | Request form, Tool edit/create |
| Pill/filter buttons (rounded-full) | Catalog filters, Request status filter |
| Tab bar (border-b underline style) | My Bookings (Current / Pending / Past) |
| Status badges (rounded-full, color-coded) | Tools, Bookings, Requests |
| Empty states (dashed border, centered text) | Catalog, Bookings, Tables |
| Activity feed (list with dividers) | Admin dashboard |
| Inline toast notifications (Sonner) | All CRUD operations |
