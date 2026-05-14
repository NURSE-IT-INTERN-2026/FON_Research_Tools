# ToolLend Next.js 16 Scaffold Plan

This file is a concrete scaffold plan for rebuilding the current UI in `Next.js 16`.

## Scope

This scaffold is intended to:

- preserve the current design language
- recreate all visible screens
- avoid backend integration at first
- let development proceed with mock data

## Phase 1 Deliverable

At the end of phase 1, you should be able to run a Next.js app and click through:

- landing page
- login page
- signup page
- borrower dashboard
- borrower bookings page
- admin dashboard
- admin inventory
- admin requests
- admin users

No real auth required yet.

## Proposed Directory Scaffold

```text
toollend-next/
  app/
    layout.tsx
    globals.css
    page.tsx
    login/page.tsx
    signup/page.tsx
    (borrower)/
      dashboard/
        layout.tsx
        page.tsx
        my-bookings/page.tsx
    (admin)/
      admin/
        layout.tsx
        dashboard/page.tsx
        inventory/page.tsx
        requests/page.tsx
        users/page.tsx
  components/
    layout/
      app-shell.tsx
      sidebar.tsx
      page-header.tsx
      dev-role-switcher.tsx
    marketing/
      landing-hero.tsx
    auth/
      login-form.tsx
      signup-form.tsx
      mock-auth-provider.tsx
      role-guard.tsx
    borrower/
      tool-filters.tsx
      tool-card.tsx
      tool-grid.tsx
      request-modal.tsx
      booking-tabs.tsx
      booking-card.tsx
    admin/
      stat-card.tsx
      recent-activity-list.tsx
      inventory-table.tsx
      tool-form-modal.tsx
      requests-table.tsx
      users-table.tsx
    ui/
      button.tsx
      input.tsx
      badge.tsx
      dialog.tsx
      table.tsx
      tabs.tsx
  lib/
    mock-data/
      tools.ts
      bookings.ts
      users.ts
      stats.ts
    constants/
      nav.ts
    utils.ts
  types/
    app.ts
    tool.ts
    booking.ts
    user.ts
```

## Page Responsibilities

### `app/layout.tsx`

- load global CSS
- mount toaster if needed
- hold global providers

### `app/page.tsx`

- public landing page
- CTA to login/signup

### `app/login/page.tsx`

- visual login only in phase 1
- can simply set mock role and route onward

### `app/signup/page.tsx`

- visual signup only in phase 1
- no backend call needed

### `app/(borrower)/dashboard/layout.tsx`

- borrower shell wrapper

### `app/(borrower)/dashboard/page.tsx`

- catalog browsing
- filter/search UI
- request modal UI

### `app/(borrower)/dashboard/my-bookings/page.tsx`

- tabbed booking lists

### `app/(admin)/admin/layout.tsx`

- admin shell wrapper

### `app/(admin)/admin/dashboard/page.tsx`

- stats cards
- recent activity list

### `app/(admin)/admin/inventory/page.tsx`

- inventory table
- tool modal

### `app/(admin)/admin/requests/page.tsx`

- request table
- approve/reject buttons

### `app/(admin)/admin/users/page.tsx`

- users table

## Minimal Mock Auth Strategy

Use a tiny client-side store only for design navigation.

Recommended behavior:

- default role is `ADMIN`
- allow switching between `ADMIN` and `BORROWER`
- keep it in `localStorage`
- do not call any backend

Recommended shape:

```ts
type AppRole = "ADMIN" | "BORROWER";

type MockAuthState = {
  role: AppRole;
  setRole: (role: AppRole) => void;
};
```

## Navigation Constants

Create `lib/constants/nav.ts`:

```ts
export const borrowerNav = [
  { href: "/dashboard", label: "Browse Tools" },
  { href: "/dashboard/my-bookings", label: "My Bookings" },
];

export const adminNav = [
  { href: "/admin/dashboard", label: "Dashboard" },
  { href: "/admin/inventory", label: "Inventory" },
  { href: "/admin/requests", label: "Requests" },
  { href: "/admin/users", label: "Users" },
];
```

## Mock Data To Prepare

### `lib/mock-data/tools.ts`

Include at least:

- 6 to 9 tools
- mixed categories
- mixed statuses
- location
- serial number
- optional image URL

### `lib/mock-data/bookings.ts`

Include:

- current approved booking
- overdue booking
- pending request
- rejected request
- returned request

### `lib/mock-data/users.ts`

Include:

- borrower profiles
- admin profile
- department field

### `lib/mock-data/stats.ts`

Include:

- total tools
- borrowed count
- pending count
- overdue count
- recent activities

## Suggested Build Sequence

### Step 1

Initialize app and styling:

- `app/layout.tsx`
- `app/globals.css`
- base typography/colors

### Step 2

Build shell and navigation:

- `app-shell.tsx`
- `sidebar.tsx`
- `page-header.tsx`
- `dev-role-switcher.tsx`

### Step 3

Build public screens:

- landing
- login
- signup

### Step 4

Build borrower UI:

- tool filters
- tool card
- request modal
- booking tabs/cards

### Step 5

Build admin UI:

- stats cards
- recent activity
- inventory table
- requests table
- users table

### Step 6

Refine polish:

- spacing
- empty states
- hover states
- modal behavior
- responsive layout

## Notes For Next.js 16 Implementation

- use Server Components by default
- mark interactive parts with `"use client"`
- keep modals, filters, tabs, and role switcher as client components
- keep static mock pages server-rendered where possible

## Suggested Initial Commands

If you build a new app from scratch:

```bash
npx create-next-app@latest toollend-next
```

Then add:

- Tailwind if desired
- shadcn/ui only if you still want the same UI primitives
- local mock data files before backend work

## What To Copy Visually From This Repo

Priority references:

- sidebar proportions and section labels
- page headers
- status badges
- table spacing
- card borders and hover states
- tool request modal layout
- borrower/admin separation

## What Not To Carry Over

- TanStack router structure
- current signup/login backend coupling
- Supabase-specific auth assumptions in early UI phase
- current auth debugging complexity

## Recommendation

Build the Next.js rewrite as a design system plus static screens first. Do not start by porting auth. The fastest path to usable output is:

1. shell
2. navigation
3. static pages
4. mock interactions
5. real backend later

## Related Reference

Use this document together with:

- [NEXTJS16_REWRITE_GUIDE.md](/Users/prindean/Desktop/Next/Vibe/Research_Tools/project-loaner-app/NEXTJS16_REWRITE_GUIDE.md:1)
