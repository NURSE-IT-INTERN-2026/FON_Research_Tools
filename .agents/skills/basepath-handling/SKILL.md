---
name: basepath-handling
description: How basePath works in Next.js 16 proxy, route handlers, server actions, and client components — when to include /researchtool and when not to
user-invocable: false
---

# basePath Handling in Next.js 16

Project uses `basePath: "/researchtool"` (set in `next.config.ts`).
Every redirect, URL match, and navigation must follow the rules below.

---

## TL;DR

| Context | basePath in URL? | Example |
|---|---|---|
| `proxy.ts` — `pathname` | **Stripped** | `/login`, `/thesis` |
| `proxy.ts` — `NextResponse.redirect()` | **Must include** | `new URL("/researchtool/login", ...)` |
| Route Handlers — `NextResponse.redirect()` | **Must include** | `new URL("/researchtool/thesis", ...)` |
| Server Actions — `redirect()` | **Auto-added** | `redirect("/login")` |
| Client Components — `<Link href>` | **Auto-added** | `<Link href="/login">` |
| Client Components — `router.push()` | **Auto-added** | `router.push("/login")` |
| Static assets — `src` in `<img>` / `<Image>` | **Must include** | Use `import` or `NEXT_PUBLIC_BASE_PATH` |
| `next/image` static import | **Auto-handled** | `import img from "..."` then `<Image src={img}>` |

---

## 1. proxy.ts (Next.js 16 Proxy)

**Path matching** — `request.nextUrl.pathname` does NOT include basePath. Next.js strips it before the proxy sees it.

```ts
// CORRECT — match without basePath
const PUBLIC_ROUTES = ["/", "/login", "/unauthorized"];
const ADMIN_PREFIX = "/admin";
const STUDENT_PREFIXES = ["/thesis"];

// WRONG — will never match
const PUBLIC_ROUTES = ["/researchtool/login"]; // ❌
```

**Redirects** — `new URL(path, request.url)` replaces the ENTIRE pathname. Must include basePath manually.

```ts
// CORRECT — include basePath in redirect target
return NextResponse.redirect(new URL("/researchtool/login", request.url));

// WRONG — missing basePath, redirects to http://host/login
return NextResponse.redirect(new URL("/login", request.url)); // ❌
```

**Helper pattern:**

```ts
const BASE = "/researchtool";
return NextResponse.redirect(new URL(`${BASE}/login`, request.url));
```

---

## 2. Route Handlers (src/app/api/*/route.ts)

Same as proxy — `NextResponse.redirect(new URL(...))` replaces entire pathname.

```ts
// CORRECT
const BASE = "/researchtool";
return NextResponse.redirect(new URL(`${BASE}/login?error=oauth_error`, request.url));

// WRONG — no basePath
return NextResponse.redirect(new URL("/login?error=oauth_error", request.url)); // ❌
```

---

## 3. Server Actions (redirect from next/navigation)

`redirect()` from `next/navigation` auto-prepends basePath. Do NOT include it.

```ts
import { redirect } from "next/navigation";

// CORRECT
redirect("/login");

// WRONG — double basePath: /researchtool/researchtool/login
redirect("/researchtool/login"); // ❌
```

Same applies to `permanentRedirect()`.

---

## 4. Client Components

`<Link>`, `useRouter().push()`, `useRouter().replace()` all auto-prepend basePath.

```tsx
// CORRECT
<Link href="/login">Login</Link>
router.push("/thesis");

// WRONG — double basePath
<Link href="/researchtool/login">Login</Link> // ❌
router.push("/researchtool/thesis"); // ❌
```

---

## 5. Static Assets (images, SVGs)

### Option A: Import as module (recommended for next/image)

```tsx
import logo from "@/../public/logo.svg";
<Image src={logo} alt="Logo" />
```

Auto-handled — Next.js includes basePath + content hash.

### Option B: Runtime path with env variable (for <img> tags)

```tsx
<img src={`${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/logo.svg`} />
```

Requires `NEXT_PUBLIC_BASE_PATH="/researchtool"` in `.env.local`.

### Option C: next/image with string src

```tsx
<Image src="/logo.svg" alt="Logo" width={100} height={100} />
```

`next/image` auto-prepends basePath for string `src`.

---

## Common Mistakes

| Mistake | Symptom | Fix |
|---|---|---|
| `redirect("/researchtool/login")` in Server Action | `/researchtool/researchtool/login` | Remove basePath: `redirect("/login")` |
| `new URL("/login", req.url)` in proxy/route handler | Goes to `/login` (no basePath) | Add basePath: `new URL("/researchtool/login", req.url)` |
| Matching `/researchtool/login` in proxy pathname | Never matches, all routes unprotected | Use `/login` without basePath |
| `<Link href="/researchtool/login">` | Double basePath in URL | Use `href="/login"` |

---

## File Checklist

When adding redirects, check the correct approach by file type:

- `proxy.ts` → match without basePath, redirect with basePath
- `src/app/api/*/route.ts` → redirect with basePath
- `src/actions/*.ts` → `redirect()` without basePath
- `src/components/*.tsx` → `<Link>` / `router.push()` without basePath
- `src/app/*/page.tsx` → `redirect()` without basePath (Server Component)
