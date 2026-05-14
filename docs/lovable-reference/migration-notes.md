# Migration Notes — Lovable to Next.js App Router

> Flags what to keep, what to redesign, and what to NOT copy.

---

## Keep as Design Reference

### Layout & Navigation
- Two-role sidebar layout (admin purple, borrower orange) — good UX distinction
- Sidebar structure: logo → nav links → user info → sign out
- Public pages as centered cards without sidebar
- Stat cards on admin dashboard linking to detail pages
- The overall page hierarchy and information architecture

### UI Patterns
- Filter pills (rounded-full toggle buttons for category/status filtering)
- Tab bar with count badges (My Bookings)
- Status badge color system (success/destructive/muted/warning)
- Card grid for tool catalog with image + metadata
- Data tables with hover row actions
- Modal forms for create/edit (tool form, borrow request)
- Empty states with dashed borders
- Toast notifications for all CRUD operations

### Data Model
- The Supabase schema (tables, enums, RLS policies) is well-designed and should be preserved
- The `has_role` security definer function
- The `handle_new_user` trigger for auto-creating profile + role on signup

### Color Theme
- Orange primary for borrower experience
- Purple primary for admin experience
- Dark sidebar vs light content area contrast
- OKLCH color values can be converted to any format

---

## Do NOT Copy

### Framework-Specific Code
- All TanStack Router/Start imports and patterns (`createFileRoute`, `createRootRouteWithContext`, etc.)
- Vite config and build system (`vite.config.ts`, `@lovable.dev/vite-tanstack-config`)
- Cloudflare adapter (`wrangler.jsonc`, `@cloudflare/vite-plugin`)
- `routeTree.gen.ts` (auto-generated route tree)
- `server.ts` and `start.ts` (TanStack Start server entry points)
- `src/lib/error-capture.ts` and `src/lib/error-page.ts` (TanStack Start error handling)

### Supabase Client Setup
- `src/integrations/supabase/client.ts` — Vite-specific (`import.meta.env`, lazy Proxy pattern)
- `src/integrations/supabase/client.server.ts` — uses `process.env` for SSR, service role key
- `src/integrations/supabase/auth-middleware.ts` — TanStack Start middleware, not needed in Next.js
- **Next.js replacement:** Use `@supabase/ssr` package with `createServerClient` / `createBrowserClient`

### Dev Bypass System (Entire)
- `VITE_DEV_BYPASS_AUTH` env var and all `devBypassRole` checks
- `isDevBypass` conditional branches in every page
- `getDevUser()`, `getInitialDevRole()`, `DEV_ROLE_STORAGE_KEY`
- Fake User/session objects (`{} as Session`, `dev-{role}@local.test`)
- **Replace with:** Next.js middleware + proper mock API routes or seeded dev database

### Mock Data
- `src/lib/mock-data.ts` — all `mock*` exports
- Inline mock CRUD operations (`if (isDevBypass) { setRows(...); return; }`)
- **Replace with:** Either a seeded Supabase instance for dev or proper Next.js API route mocks

### Raw HTML Inputs
- All `<input>`, `<textarea>`, `<select>` elements use raw HTML with manual className strings instead of shadcn/ui components
- The `inputCls` constant in admin.inventory.tsx
- **Replace with:** shadcn/ui `<Input>`, `<Textarea>`, `<Select>` components properly integrated

### `prompt()` for Admin Notes
- Admin requests page uses `window.prompt()` to collect approval/rejection notes
- **Replace with:** A proper dialog/modal form

### Inline Components
- `RequestModal`, `ToolFormModal`, `DateField`, `Field` are defined inside route files
- **Should be:** Extracted into dedicated component files

### Unused Dependencies
- `react-hook-form` + `@hookform/resolvers` + `zod` are installed but NOT used in any page
- `recharts` is installed but NOT used
- Most shadcn/ui components installed but not used
- `useIsMobile` hook installed but not used

---

## Architectural Changes for Next.js

### Routing
| Lovable (TanStack) | Next.js App Router |
|---|---|
| File-based via `src/routes/` | File-based via `src/app/` |
| `createFileRoute("/admin/dashboard")` | `app/admin/dashboard/page.tsx` |
| `RoleGuard` component | Next.js middleware + layout auth checks |
| `AppLayout` component | Nested layouts (`app/(borrower)/layout.tsx`, `app/(admin)/layout.tsx`) |
| `__root.tsx` shell | `app/layout.tsx` root layout |

### Data Fetching
| Lovable | Next.js |
|---|---|
| `useEffect` + `supabase.from().select()` in components | Server Components + Supabase server client |
| Client-side `useState` for all data | Server-side data fetching, pass as props |
| TanStack React Query (installed, barely used) | Remove or use for client-side mutations only |

### Auth
| Lovable | Next.js |
|---|---|
| `AuthProvider` context wrapping app | `@supabase/ssr` middleware for server-side auth |
| `useAuth()` hook for client components | Server: cookies; Client: `useSupabase` hook |
| Client-side role redirect in RoleGuard | Server-side redirect in middleware/layout |

### State Management
- Current: All local `useState` + `useEffect` for fetching
- Recommended for Next.js: Server Components for reads, Server Actions for mutations, minimal client state

---

## Critical Items for Rewrite

1. **Auth must be server-side first.** The Lovable app does everything client-side. Next.js should use middleware to protect routes and Server Components to avoid client-side auth flashes.

2. **No more `prompt()`.** Admin notes must use a proper dialog component.

3. **Extract inline components.** RequestModal, ToolFormModal should be their own files.

4. **Use proper form validation.** `react-hook-form` + `zod` are installed but unused. Use them in the rewrite or remove them.

5. **Image upload is a stub.** The "Upload (soon)" button in the tool form does nothing. Decide if file upload is in MVP scope.

6. **Responsive sidebar is missing.** The sidebar is always `w-64` — no mobile hamburger menu. `useIsMobile` hook exists but is unused. Mobile UX needs design.

7. **No pagination.** All tables load everything at once. Add pagination or infinite scroll for production.

8. **No optimistic updates.** All mutations wait for server response. Consider optimistic UI for better UX.

9. **No error boundaries per route.** Only a global error page exists. Next.js error.tsx files should be added per route segment.

10. **No loading skeletons.** All loading states show plain "Loading..." text. Use skeleton components for better perceived performance.
