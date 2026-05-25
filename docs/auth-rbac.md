# Authentication & RBAC

---

## Strategy

Server-side first. Auth state is resolved in `proxy.ts` and Server Components — no client-side auth flashing.

---

## Authentication: CMU OAuth 2.0

### Flow

```
1. ผู้ใช้กด "เข้าสู่ระบบ" → /login redirect ไป Microsoft Azure AD
2. กรอก CMU IT Account + Password
3. Microsoft ส่ง Authorization Code กลับมาที่ /api/auth/callback
4. แลก Code เป็น Access Token (POST to token endpoint)
5. เรียก CMU MIS API (/v3/me/basicinfo) ดึงข้อมูลผู้ใช้
6. สร้าง/อัปเดต Profile + UserRole ในฐานข้อมูล
7. สร้าง session (HttpOnly cookie) → redirect ตามบทบาท
```

### OAuth Configuration

| Setting | Value |
|---|---|
| Tenant ID | `cf81f1df-de59-4c29-91da-a2dfd04aa751` |
| Authorize URL | `https://login.microsoftonline.com/{tenant}/oauth2/v2.0/authorize` |
| Token URL | `https://login.microsoftonline.com/{tenant}/oauth2/v2.0/token` |
| Scope | `api://cmu/Mis.Account.Read.Me.Basicinfo` |
| Callback URL | `/api/auth/callback` |

### Role Determination

Priority order:

| Priority | Condition | Role | Redirect |
|---|---|---|---|
| 1 | `ADMIN_EMAILS` env contains user's cmuitaccount | ADMIN | `/admin/dashboard` |
| 2 | `itaccount_type_id` = `StdAcc` | STUDENT | `/dashboard` |
| 3 | No `itaccount_type_id` but has `student_id` | STUDENT | `/dashboard` |
| 4 | None of the above | — | `/unauthorized` |

### Data from CMU MIS API

| Data | Field | Stored In |
|---|---|---|
| ชื่อ-นามสกุล | `name` | Profile.name |
| อีเมล | `email` | Profile.email |
| ประเภทบัญชี | `itaccount_type_id` | Profile.accountType |
| CMU IT Account | `cmuitaccount_name` | Profile.cmuItAccount |
| รหัสนักศึกษา | `student_id` | Profile.studentId |

**ข้อมูลวิทยานิพนธ์ไม่เก็บใน DB** — ดึงจาก Thesis API ทุกครั้งที่แสดงผล (title_th, title_en, major_th, level_name_th, curriculum)

---

## Session Management

- Session stored in HttpOnly cookie
- Algorithm: HMAC-SHA256 (`node:crypto`)
- Token format: `<base64url(payload)>.<base64url(signature)>`
- Payload: `{ userId, email, role, name, exp, ver }`
- Cookie name: `app_session`
- Session timeout: 8 ชั่วโมง (480 นาที)

---

## Proxy (`proxy.ts`)

Runs on every matched request. Responsibilities:

1. **Read session** — call `verifySessionToken()` from cookie
2. **Protect routes** — redirect to `/` if no valid session
3. **Enforce role** — redirect wrong-role users:
   - Student on `/admin/*` → `/dashboard`
   - Admin on `/dashboard` → `/admin/dashboard`
4. **Redirect authenticated** — `/`, `/login` redirect to dashboard if session exists

---

## RBAC Matrix

| Resource | Student | Admin | No Role |
|---|---|---|---|
| View landing page (`/`) | Redirect to dashboard | Redirect to dashboard | See page |
| Login (CMU OAuth) | Redirect to dashboard | Redirect to dashboard | Proceed |
| View own profile + thesis | Yes | — | Redirect to `/` |
| Upload document | Yes | — | Redirect to `/` |
| View own documents | Yes | — | Redirect to `/` |
| Remove own PENDING document | Yes | — | N/A |
| View all documents | — | Yes | Redirect to `/` |
| Approve/reject documents | — | Yes | Redirect to `/` |
| Bulk approve (PENDING only) | — | Yes | Redirect to `/` |
| Remove any document | — | Yes | Redirect to `/` |
| View student list | — | Yes | Redirect to `/` |
| Search students | — | Yes | Redirect to `/` |
| View activity log | — | Yes | Redirect to `/` |
| Access admin routes | Redirect to `/dashboard` | Yes | Redirect to `/` |
| API `/api/my/documents` | Yes | — | 401 |

### Edge cases

| Scenario | Behavior |
|---|---|
| AlumAcc login | Redirect to `/unauthorized` — ระบบไม่รองรับศิษย์เก่า |
| Session expired | Proxy redirects to `/` |
| `AUTH_SECRET` rotated | Set `AUTH_SESSION_VERSION` to invalidate all sessions |

---

## Auth Helpers

Located in `src/lib/auth.ts`:

```ts
export type AuthContext = {
  userId: string;
  email: string;
  role: "ADMIN" | "STUDENT";
};
```

| Function | Returns | Purpose |
|---|---|---|
| `getSession()` | `AuthSession \| null` | Read session from cookie |
| `getUserRole(userId)` | `AppRole \| null` | Query UserRole via Prisma |
| `requireAuth()` | `{ userId: string, email: string }` | Get authenticated user or `unauthorized()` |
| `requireRole(role)` | `AuthContext` | Verify role or `forbidden()` |

---

## File Structure

```
src/lib/
├── auth.ts                ← getSession, requireAuth, requireRole helpers
├── auth/
│   ├── session-token.ts   ← HMAC-SHA256 token create/verify
│   ├── session.ts         ← Cookie management
│   └── roles.ts           ← Role redirect paths
└── db.ts                  ← Prisma client singleton
src/proxy.ts               ← Next.js 16 proxy (route protection)
src/app/
├── unauthorized.tsx       ← 401 page
├── forbidden.tsx          ← 403 page
├── (student)/
│   └── layout.tsx         ← requireRole("STUDENT")
└── (admin)/
    └── layout.tsx         ← requireRole("ADMIN")
```
