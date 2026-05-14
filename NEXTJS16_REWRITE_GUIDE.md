# ToolLend Next.js 16 Rewrite Guide

This document captures the current UI structure of the `ToolLend` app and translates it into a practical rewrite plan for `Next.js 16`.

## Goal

The current project is useful as a design reference, not as a long-term foundation. The rewrite goal is:

- preserve the visual structure and user flows
- remove dependence on TanStack Start routing
- rebuild pages in `Next.js 16`
- start with static/mock data first
- add real auth and backend logic later

## Current UI Map

Public pages:

- `/`
- `/login`
- `/signup`

Borrower pages:

- `/dashboard`
- `/dashboard/my-bookings`

Admin pages:

- `/admin/dashboard`
- `/admin/inventory`
- `/admin/requests`
- `/admin/users`

Shared structure:

- root shell with global CSS and toaster
- role-based app shell with sidebar
- route guard per role

## Recommended Next.js 16 App Structure

```text
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
    role-switcher.tsx
  auth/
    auth-provider.tsx
    role-guard.tsx
  marketing/
    landing-hero.tsx
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
    ...
lib/
  mock-data/
    tools.ts
    bookings.ts
    users.ts
    dashboard.ts
  auth/
    session.ts
  utils.ts
types/
  tool.ts
  booking.ts
  user.ts
```

## Rewrite Order

1. Build shared shell and CSS foundation.
2. Recreate landing, login, and signup as static pages.
3. Recreate borrower pages with mock data.
4. Recreate admin pages with mock data.
5. Add role switching for local preview.
6. Add real auth and data only after UI parity is good enough.

## Component Breakdown For Rewrite

### 1. Shared Layout Components

These should be built first because every authenticated page depends on them.

`AppShell`

- left sidebar
- content container
- user email area
- sign out action placeholder
- role-specific menu items

`Sidebar`

- logo block
- section navigation
- active state styling
- optional dev role switcher

`PageHeader`

- page title
- short subtitle

`RoleGuard`

- for rewrite phase 1, this can be a simple prop or mock session check
- later, move to real auth logic

### 2. Public/Auth Components

`LandingHero`

- app logo
- title
- short product description
- two CTA buttons

`LoginForm`

- email input
- password input
- submit button
- sign up link

`SignupForm`

- full name
- email
- department
- password
- role selector
- create account button
- sign in link

### 3. Borrower UI Components

`ToolFilters`

- search input
- category pills
- status pills

`ToolCard`

- image area
- name
- category
- description
- location
- serial number
- status badge
- CTA button

`ToolGrid`

- grid wrapper for cards

`RequestModal`

- tool summary panel
- start date
- end date
- purpose textarea
- cancel and confirm buttons

`BookingTabs`

- current
- pending
- past

`BookingCard`

- tool image
- tool name
- category
- date range
- purpose
- admin notes
- status badge
- context action button

### 4. Admin UI Components

`StatCard`

- icon
- count
- label
- link behavior

`RecentActivityList`

- borrower name
- action verb
- tool name
- created timestamp

`InventoryTable`

- image
- name
- category
- serial number
- status badge
- location
- row actions

`ToolFormModal`

- create/edit tool form
- name
- description
- category
- serial number
- image URL
- location
- status

`RequestsTable`

- borrower identity
- tool
- dates
- purpose
- status
- approve/reject/return actions

`UsersTable`

- name
- email
- department
- roles

## Page-by-Page Mapping

### `/`

Source intent:

- simple landing page
- direct users to login or signup

Next.js page:

- `app/page.tsx`

Components:

- `LandingHero`

### `/login`

Source intent:

- basic form card
- redirect to role-specific area after login

Next.js page:

- `app/login/page.tsx`

Components:

- `LoginForm`

### `/signup`

Source intent:

- create account form
- choose role visually

Next.js page:

- `app/signup/page.tsx`

Components:

- `SignupForm`

### `/dashboard`

Source intent:

- borrower tool browsing page
- search, filter, request

Next.js page:

- `app/(borrower)/dashboard/page.tsx`

Components:

- `PageHeader`
- `ToolFilters`
- `ToolGrid`
- `ToolCard`
- `RequestModal`

### `/dashboard/my-bookings`

Source intent:

- borrower history and active loan tracking

Next.js page:

- `app/(borrower)/dashboard/my-bookings/page.tsx`

Components:

- `PageHeader`
- `BookingTabs`
- `BookingCard`

### `/admin/dashboard`

Source intent:

- KPI overview
- recent activity feed

Next.js page:

- `app/(admin)/admin/dashboard/page.tsx`

Components:

- `PageHeader`
- `StatCard`
- `RecentActivityList`

### `/admin/inventory`

Source intent:

- catalog management

Next.js page:

- `app/(admin)/admin/inventory/page.tsx`

Components:

- `PageHeader`
- `InventoryTable`
- `ToolFormModal`

### `/admin/requests`

Source intent:

- request triage and approvals

Next.js page:

- `app/(admin)/admin/requests/page.tsx`

Components:

- `PageHeader`
- `RequestsTable`

### `/admin/users`

Source intent:

- account listing page

Next.js page:

- `app/(admin)/admin/users/page.tsx`

Components:

- `PageHeader`
- `UsersTable`

## Data Strategy For Rewrite

For phase 1, use local mock data only.

Recommended files:

- `lib/mock-data/tools.ts`
- `lib/mock-data/bookings.ts`
- `lib/mock-data/users.ts`
- `lib/mock-data/dashboard.ts`

This keeps the rewrite focused on design and layout instead of backend issues.

## State Strategy

For rewrite phase 1:

- keep most pages server-rendered or static
- use small client components only for modal open state, filter state, and tab state
- do not wire real auth yet

For rewrite phase 2:

- introduce real auth
- replace mock data with API or Supabase access
- move page actions to server actions or route handlers where appropriate

## Recommendation

The cleanest rewrite path is:

1. replicate the current screens exactly with mock data
2. keep auth fake during design migration
3. stabilize the component system
4. only then connect real backend behavior

This avoids carrying over the current auth/debug complexity into the rewrite.

## Suggested Initial Build List

- `app/layout.tsx`
- `app/globals.css`
- `components/layout/app-shell.tsx`
- `components/layout/sidebar.tsx`
- `components/layout/page-header.tsx`
- `components/marketing/landing-hero.tsx`
- `components/borrower/tool-card.tsx`
- `components/borrower/tool-filters.tsx`
- `components/borrower/request-modal.tsx`
- `components/borrower/booking-card.tsx`
- `components/admin/stat-card.tsx`
- `components/admin/inventory-table.tsx`
- `components/admin/requests-table.tsx`
- `components/admin/users-table.tsx`

## Files To Use As Reference In This Repo

- [src/components/AppLayout.tsx](/Users/prindean/Desktop/Next/Vibe/Research_Tools/project-loaner-app/src/components/AppLayout.tsx:1)
- [src/components/RoleGuard.tsx](/Users/prindean/Desktop/Next/Vibe/Research_Tools/project-loaner-app/src/components/RoleGuard.tsx:1)
- [src/routes/index.tsx](/Users/prindean/Desktop/Next/Vibe/Research_Tools/project-loaner-app/src/routes/index.tsx:1)
- [src/routes/login.tsx](/Users/prindean/Desktop/Next/Vibe/Research_Tools/project-loaner-app/src/routes/login.tsx:1)
- [src/routes/signup.tsx](/Users/prindean/Desktop/Next/Vibe/Research_Tools/project-loaner-app/src/routes/signup.tsx:1)
- [src/routes/dashboard.tsx](/Users/prindean/Desktop/Next/Vibe/Research_Tools/project-loaner-app/src/routes/dashboard.tsx:1)
- [src/routes/dashboard.my-bookings.tsx](/Users/prindean/Desktop/Next/Vibe/Research_Tools/project-loaner-app/src/routes/dashboard.my-bookings.tsx:1)
- [src/routes/admin.dashboard.tsx](/Users/prindean/Desktop/Next/Vibe/Research_Tools/project-loaner-app/src/routes/admin.dashboard.tsx:1)
- [src/routes/admin.inventory.tsx](/Users/prindean/Desktop/Next/Vibe/Research_Tools/project-loaner-app/src/routes/admin.inventory.tsx:1)
- [src/routes/admin.requests.tsx](/Users/prindean/Desktop/Next/Vibe/Research_Tools/project-loaner-app/src/routes/admin.requests.tsx:1)
- [src/routes/admin.users.tsx](/Users/prindean/Desktop/Next/Vibe/Research_Tools/project-loaner-app/src/routes/admin.users.tsx:1)
