# Component Inventory — Lovable Reference Project

> Lists every custom component (not shadcn/ui primitives). Documents purpose, props, and where it's used.

---

## Custom Components

### `AppLayout` — `src/components/AppLayout.tsx`

**Purpose:** Sidebar + main content shell for all authenticated pages. Renders different navigation based on role.

**Props:**
- `role: AppRole` — determines which nav items appear and which color theme
- `children: ReactNode` — page content rendered in the main area

**Behavior:**
- Renders a fixed `w-64` sidebar with: logo, nav links (with active state), dev role switcher, user email, sign-out button
- Admin role: purple-themed sidebar, nav links to admin pages
- Borrower role: orange-themed sidebar, nav links to borrower pages
- Dev bypass: shows role switcher at bottom of sidebar (ADMIN/BORROWER toggle)
- Main content: `max-w-6xl mx-auto p-6 md:p-10`

**Used by:** All 6 authenticated pages wrap their content in `<AppLayout>`

---

### `RoleGuard` — `src/components/RoleGuard.tsx`

**Purpose:** Auth + role gate. Redirects unauthenticated users to `/login` and wrong-role users to their correct dashboard.

**Props:**
- `require: AppRole` — required role to see the children
- `children: ReactNode`

**Behavior:**
- While loading: shows "Loading..." centered
- No user: redirects to `/login`
- User has no role: shows "Account setup incomplete" message
- Wrong role: redirects to correct dashboard
- Correct role: renders children

**Used by:** All 6 authenticated pages wrap their content in `<RoleGuard>`

---

### `RequestModal` — inline in `src/routes/dashboard.tsx`

**Purpose:** Borrow request form shown when a borrower clicks "Request to Borrow" on a tool card.

**Props:**
- `tool: Tool` — the tool being requested
- `onClose: () => void` — close handler

**Behavior:**
- Two-column layout: tool info (left) + form (right)
- Form fields: Start Date, End Date (Calendar popovers), Purpose (textarea)
- Validates: both dates required, end >= start, purpose non-empty
- Submits to Supabase `bookings` table or mock
- Shows success/error toast

**Note:** Not extracted into its own component file. Should be extracted in the rewrite.

---

### `ToolFormModal` — inline in `src/routes/admin.inventory.tsx`

**Purpose:** Create/edit form for tools, shown when admin clicks "Add New Tool" or "Edit".

**Props:**
- `initial: ToolInsert | Tool` — empty for create, existing tool for edit
- `onClose: () => void`
- `onSaved: (tool?: Tool) => void`
- `isDevBypass: boolean`

**Behavior:**
- Single-column form with fields: Name, Description, Category, Serial Number, Image URL, Location, Status
- Two-column grid sections for paired fields
- Disabled "Upload (soon)" button for image upload (placeholder feature)
- Creates or updates via Supabase or mock

**Note:** Not extracted into its own component file. Should be extracted in the rewrite.

---

### `DateField` — inline in `src/routes/dashboard.tsx`

**Purpose:** Reusable date picker field (label + button + Calendar popover).

**Props:**
- `label: string`
- `date: Date | undefined`
- `onSelect: (d: Date | undefined) => void`
- `disabledBefore: Date`

**Note:** Small reusable helper. Should be extracted in the rewrite.

---

### `Field` — inline in `src/routes/admin.inventory.tsx`

**Purpose:** Label wrapper for form fields (label text + children).

**Props:**
- `label: string`
- `children: ReactNode`

**Note:** Minimal helper, `inputCls` constant also defined inline.

---

## Hooks

### `useAuth` — `src/hooks/use-auth.tsx`

**Purpose:** Provides auth state (user, session, role, loading) and actions (signOut, refreshRole, setDevRole) via React Context.

**Exported values:**
- `user: User | null`
- `session: Session | null`
- `role: AppRole | null`
- `loading: boolean`
- `isDevBypass: boolean`
- `signOut: () => Promise<void>`
- `refreshRole: () => Promise<void>`
- `setDevRole: (role: AppRole) => void`

**Provider:** `AuthProvider` wraps the app root, listens to `onAuthStateChange`, loads role from `user_roles` table.

**Dev bypass:** When `VITE_DEV_BYPASS_AUTH` is set, creates fake User objects with `dev-{role}@local.test` emails. Role stored in localStorage key `toollend-dev-role`.

---

### `useIsMobile` — `src/hooks/use-mobile.tsx`

**Purpose:** Returns `true` if viewport width < 768px. Uses `matchMedia` listener.

**Note:** Installed by shadcn/ui but NOT actually used in any page. Can be ignored unless responsive sidebar is needed.

---

## shadcn/ui Primitives (45 components installed)

These are standard shadcn/ui components — NOT custom. Listed for reference only; the rewrite should install its own fresh copies.

`accordion`, `alert-dialog`, `alert`, `aspect-ratio`, `avatar`, `badge`, `breadcrumb`, `button`, `calendar`, `card`, `carousel`, `chart`, `checkbox`, `collapsible`, `command`, `context-menu`, `dialog`, `drawer`, `dropdown-menu`, `form`, `hover-card`, `input-otp`, `input`, `label`, `menubar`, `navigation-menu`, `pagination`, `popover`, `progress`, `radio-group`, `resizable`, `scroll-area`, `select`, `separator`, `sheet`, `sidebar`, `skeleton`, `slider`, `sonner`, `switch`, `table`, `tabs`, `textarea`, `toggle-group`, `toggle`, `tooltip`

**Actually used in pages:** `button`, `card`, `calendar`, `popover`, `table` (via raw HTML), `badge` (via manual badge styling), `input` (via raw HTML), `textarea` (via raw HTML), `sonner` (Toaster)

**Installed but unused:** Most of the list. The Lovable project installed all shadcn/ui components by default but only uses a handful. The rewrite should install only what's needed.
