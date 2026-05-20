# OAuth CSRF State Parameter Implementation

เพิ่ม `state` parameter ใน OAuth flow เพื่อป้องกัน CSRF attack ตาม RFC 6749 Section 10.12

## ปัญหา

ก่อนหน้านี้ OAuth flow ไม่มี `state` parameter:

1. Login page สร้าง Microsoft authorize URL ตรงจาก Server Component → ไม่มีที่เก็บ state
2. Microsoft ส่ง callback กลับมาเฉยๆ → ไม่มี `state` ให้ตรวจ
3. Callback route รับ `code` แลก token ทันที → ไม่ validate อะไร

**ความเสี่ยง:** แฮกเกอร์สามารถสร้างลิงก์ `callback?code=ATTACKER_CODE` ให้เหยื่อคลิก → เหยื่อถูก login ด้วยบัญชีแฮกเกอร์โดยไม่รู้ตัว

## วิธีแก้

เพิ่ม CSRF protection ด้วย `state` parameter + httpOnly cookie:

```
Login flow ใหม่:

1. ผู้ใช้กด login → <a href="/researchtool/api/auth/cmu">
2. Route handler สร้าง random UUID → เก็บใน cookie "oauth_state" (10 นาที)
3. Redirect ไป Microsoft พรับ ?state=<uuid>
4. Microsoft ส่งกลับมา ?code=xxx&state=<uuid>
5. Callback ตรวจ state ใน URL กับ cookie → ตรงกัน → แลก token
                                            → ไม่ตรง → ปฏิเสธ
6. Cookie ถูกลบทุก exit path (สำเร็จ/ล้มเหลว)
```

## ไฟล์ที่เปลี่ยนแปลง

| ไฟล์ | การเปลี่ยนแปลง |
|---|---|
| `src/app/api/auth/cmu/route.ts` | **สร้างใหม่** — Route handler สร้าง `randomUUID()` state → set `oauth_state` cookie (httpOnly, secure, sameSite=lax, maxAge=600) → redirect ไป Microsoft พร้อม `state` param |
| `src/lib/auth/cmu-oauth.ts` | `getAuthorizationUrl(state: string)` เพิ่ม `state` เข้า URL params |
| `src/app/login/page.tsx` | เปลี่ยนจากเรียก `getAuthorizationUrl()` เป็นส่ง `<a href>` ไป `/api/auth/cmu` (พร้อม basePath) |
| `src/app/login/login-client.tsx` | เปลี่ยน prop เป็น `loginHref` + เพิ่ม error message `oauth_state_mismatch` ("เกิดข้อผิดพลาดด้านความปลอดภัย กรุณาลองใหม่") |
| `src/app/api/auth/callback/route.ts` | เพิ่ม state validation ก่อน token exchange + helper `redirectWithClearedState()` ลบ cookie ทุก exit path |
| `docs/route-map.md` | เพิ่ม `/api/auth/cmu` route เข้า route tree และ table |

## รายละเอียดแต่ละไฟล์

### `src/app/api/auth/cmu/route.ts` (สร้างใหม่)

```ts
export async function GET() {
  const state = randomUUID();                          // สร้าง random state
  const authorizeUrl = getAuthorizationUrl(state);     // ใส่ state ใน authorize URL
  const response = NextResponse.redirect(authorizeUrl);
  response.cookies.set("oauth_state", state, {         // เก็บใน httpOnly cookie
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 600,                                       // หมดอายุใน 10 นาที
    path: "/",
  });
  return response;
}
```

### `src/lib/auth/cmu-oauth.ts`

```diff
- export function getAuthorizationUrl() {
+ export function getAuthorizationUrl(state: string) {
    const params = new URLSearchParams({
      client_id: CLIENT_ID!,
      response_type: "code",
      redirect_uri: REDIRECT_URI!,
      scope: SCOPE!,
      response_mode: "query",
+     state,
    });
```

### `src/app/api/auth/callback/route.ts`

```ts
// Helper: redirect + ลบ oauth_state cookie ทุกครั้ง
function redirectWithClearedState(request, path): NextResponse {
  const res = NextResponse.redirect(new URL(path, request.url));
  res.cookies.set("oauth_state", "", { maxAge: 0, path: "/" });
  return res;
}

// Validate state ก่อน token exchange
const storedState = request.cookies.get("oauth_state")?.value;
if (!state || state !== storedState) {
  return redirectWithClearedState(request, `${BASE}/login?error=oauth_state_mismatch`);
}
```

## Security Checklist

- [x] State สร้างด้วย `randomUUID()` (cryptographically secure)
- [x] State เก็บใน httpOnly cookie (JavaScript อ่านไม่ได้)
- [x] Cookie มี `secure` flag ใน production
- [x] Cookie มี `sameSite=lax` (ป้องกัน cross-site request)
- [x] Cookie มีอายุ 10 นาที (จำกัดหน้าต่างโอกาส)
- [x] State validate ก่อน token exchange (ปฏิเสธ code ที่ไม่มี state ที่ตรงกัน)
- [x] Cookie ถูกลบทุก exit path (สำเร็จ, ล้มเหลว, error ทุกแบบ)
- [x] Error code `oauth_state_mismatch` มี Thai message สำหรับผู้ใช้
