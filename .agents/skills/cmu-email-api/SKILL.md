---
name: cmu-email-api
description: Generic CMU Email API reference. Two-step OAuth flow: GetToken → SendEmail. Reusable across any project that sends email through CMU's SMTP relay.
---

# CMU Email API — Generic Reference

REST API สำหรับส่งอีเมลผ่าน SMTP relay ของมช.

## API Endpoints

### 1. GetToken — ขอ access token

```
POST {BASE_URL}/EmailApi/GetToken
Content-Type: application/json
```

```json
{
  "client_id": "<client_id>",
  "client_secret": "<client_secret>"
}
```

**Response:**

```json
{
  "success": true,
  "access_token": "eyJJbGllbnR...",
  "token_type": "Bearer",
  "expires_in": 86400
}
```

| Field | Type | Description |
|---|---|---|
| `success` | bool | สำเร็จหรือไม่ |
| `access_token` | string | JWT Bearer token |
| `token_type` | string | `"Bearer"` |
| `expires_in` | number | อายุ token เป็นวินาที (86400 = 24 ชม.) |

**Error (401):**
```json
{ "success": false, "message": "Invalid client_id or client_secret" }
```

### 2. SendEmail — ส่งอีเมล

```
POST {BASE_URL}/EmailApi/SendEmail
Content-Type: application/json
Authorization: Bearer <access_token>
```

```json
{
  "subject": "หัวข้ออีเมล",
  "sent_to": "a@cmu.ac.th, b@cmu.ac.th",
  "cc_to": "cc@cmu.ac.th",
  "message": "ข้อความ\n\nบรรทัดใหม่",
  "system_name": "<ชื่อระบบ>"
}
```

| Field | Required | Description |
|---|---|---|
| `subject` | Yes | หัวข้ออีเมล |
| `sent_to` | Yes | ผู้รับ คั่นด้วย comma |
| `cc_to` | No | CC คั่นด้วย comma |
| `message` | Yes | เนื้อหา ใช้ `\n` หรือ `<br/>` ขึ้นบรรทัดใหม่ |
| `system_name` | Yes | ชื่อระบบผู้ส่ง |

**Response:**

```json
{ "success": true, "message": "Email sent successfully" }
```

### Error Codes

| HTTP Status | Meaning |
|---|---|
| 400 | Missing required field (`subject`, `sent_to`, `message`, `system_name`) |
| 401 | Token หมดอายุ / ไม่ถูกต้อง / ไม่มี Authorization header |
| 500 | SMTP error — ตรวจสอบ server log |

## Implementation Patterns

### Token caching

Token อายุ 24 ชม. — cache แล้ว refresh ก่อนหมดอายุ

```ts
type TokenCache = { token: string; expiresAt: number };

// Refresh 1 hour before expiry
if (cached.expiresAt > Date.now() + 3600000) {
  return cached.token;
}
```

### Fire-and-forget

```ts
// ไม่ block response — email failure ต้องไม่ทำให้ flow พัง
sendEmail({ ... }).catch(() => {});
```

### Multi-recipient

```ts
// คั่นด้วย comma
sent_to: "a@cmu.ac.th, b@cmu.ac.th"
cc_to: "c@cmu.ac.th, d@cmu.ac.th"
```
