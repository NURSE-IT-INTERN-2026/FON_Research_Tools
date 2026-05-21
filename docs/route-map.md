# Route Map

All routes use Next.js App Router (`src/app/`).

---

## Route Tree

```
src/app/
├── layout.tsx                    ← Root layout (html, body, fonts, providers)
├── page.tsx                      ← Landing page
├── login/
│   └── page.tsx                  ← Redirect to CMU OAuth 2.0
├── admin/
│   └── login/
│       └── page.tsx              ← Admin login (username/password)
├── api/
│   └── auth/
│       ├── cmu/
│       │   └── route.ts          ← Generate state + redirect to Microsoft authorize URL
│       └── callback/
│           └── route.ts          ← OAuth callback (validate state, exchange code, create session)
│   └── documents/
│       └── [id]/
│           ├── file/
│           │   └── route.ts      ← Serve PDF file
│           ├── approve/
│           │   └── route.ts      ← Approve document
│           ├── reject/
│           │   └── route.ts      ← Reject document
│           └── route.ts          ← DELETE: remove document
│   └── my/
│       └── documents/
│           └── route.ts          ← GET: student's own documents with status
├── unauthorized.tsx              ← 401 (AlumAcc or no access)
├── forbidden.tsx                 ← 403 (wrong role)
├── not-found.tsx                 ← 404
├── error.tsx                     ← Error boundary
├── global-error.tsx              ← Root error boundary
├── (student)/                    ← Route group: student layout + auth guard
│   ├── layout.tsx                ← Sidebar (orange theme) + main content
│   └── dashboard/
│       └── page.tsx              ← Profile + thesis info + upload form + document list
└── (admin)/                      ← Route group: admin layout + auth guard
    ├── layout.tsx                ← Sidebar (purple theme) + search button on navbar
    └── admin/
        ├── dashboard/
        │   └── page.tsx          ← Stat cards + recent activity
        ├── documents/
        │   └── page.tsx          ← Document list with filters + approve/reject/remove
        ├── students/
        │   ├── page.tsx          ← Student list with status + document counts
        │   └── [id]/
        │       └── page.tsx      ← Student detail: profile + thesis + documents with actions
        └── activity-log/
            └── page.tsx          ← Full activity log with search + filters
```

---

## Route Details

### Public Routes

| Route | Page | Auth | Data |
|---|---|---|---|
| `/` | Landing | No auth required | None |
| `/login` | Login page (link to `/api/auth/cmu`) | No auth required | None |
| `/admin/login` | Admin login (username/password) | No auth required | Admin credentials from env |
| `/api/auth/cmu` | Generate state cookie + redirect to Microsoft | No auth required | None |
| `/api/auth/callback` | OAuth callback (validate state, exchange code) | Public (receives code) | CMU MIS API |

### Student Routes (requires `STUDENT` role)

| Route | Page | Data Source |
|---|---|---|
| `/dashboard` | Profile + upload + documents | Profile (MIS API data), Document table filtered by userId |

### Admin Routes (requires `ADMIN` role)

| Route | Page | Data Source |
|---|---|---|
| `/admin/dashboard` | Stats + activity | Aggregate counts on Document; recent ActivityLog + Profile join |
| `/admin/documents` | Document management | Document + Profile join, filtered by status via URL `searchParams`, backend pagination (`page`, `limit`) |
| `/admin/students` | Student list | Profile, Document count per student, search by name/studentId |
| `/admin/students/[id]` | Student detail | Profile, Thesis API data, Documents with approve/reject/remove actions |
| `/admin/activity-log` | Activity log | ActivityLog + Profile join, filtered/searched via URL `searchParams`, backend pagination, date filter (`from`, `to`) |

### API Routes

| Method | Route | Auth | Description |
|---|---|---|---|
| POST | `/api/documents` | Student | Upload PDF + create Document record |
| GET | `/api/documents/[id]/file` | Student (own) / Admin | Serve PDF file |
| DELETE | `/api/documents/[id]` | Student (own, PENDING) / Admin | Remove document + file |
| PATCH | `/api/documents/[id]/approve` | Admin | Approve document |
| PATCH | `/api/documents/[id]/reject` | Admin | Reject document with notes |
| GET | `/api/my/documents` | Student | Own documents with status + approval timestamps |
| GET | `/api/documents/[id]/certificate` | Student (own) / Admin | Download PDF certificate (APPROVED only) |

---

## Auth & Guard Strategy

- **Proxy** (`proxy.ts`): reads session cookie, redirects unauthenticated to `/`, redirects wrong-role to correct dashboard. Uses Next.js 16 `proxy()` export.
- **Layout guards**: `(student)/layout.tsx` calls `requireRole("STUDENT")`, `(admin)/layout.tsx` calls `requireRole("ADMIN")`.
- **Server Components**: fetch data server-side using session — no client-side auth flashing.

---

## Server Actions

| Action | Trigger | Mutations |
|---|---|---|
| `uploadDocument` | Student upload form | Save PDF to filesystem + insert Document row + send email to admin |
| `removeDocument` | Student/Admin remove button | Delete file + delete Document row |
| `approveDocument` | Admin approve button | Update Document → APPROVED, set approvedBy + approvedAt + send email to student |
| `approveAllStudentPending` | Admin "อนุมัติทั้งหมด" button | Update all PENDING documents for a specific student → APPROVED + send email to student |
| `rejectDocument` | Admin reject button | Update Document → REJECTED, set adminNotes + approvedBy + approvedAt + send email to student with reason |
| `getRecentActivity` | Activity panel | Query ActivityLog last 25, admin-only |
| `logActivity` | Internal (after every mutation) | Insert ActivityLog row (fire-and-forget) |

---

## Naming Conventions

- Route groups use parentheses: `(student)`, `(admin)`
- Page files are always `page.tsx`
- Layout files are always `layout.tsx`
- Route protection uses `proxy.ts` with `export function proxy()` (Next.js 16+)
