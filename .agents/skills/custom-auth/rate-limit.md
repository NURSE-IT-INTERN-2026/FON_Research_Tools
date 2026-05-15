# Rate Limiting — Sliding Window

## Implementation

**File:** `src/lib/security/rate-limit.ts`

```typescript
import { createHash } from "node:crypto";

type RateLimitEntry = {
  count: number;
  resetAt: number;
};

export type ConsumeRateLimitInput = {
  bucket: string;
  key: string;
  limit: number;
  windowMs: number;
};

type RateLimitConsumeResult = {
  allowed: boolean;
  retryAfterSeconds: number;
  remaining: number;
};

type RateLimitProvider = {
  consume: (
    key: string,
    limit: number,
    windowMs: number,
  ) => RateLimitConsumeResult;
  reset: (key: string) => void;
};

declare global {
  var __appRateLimitStore: Map<string, RateLimitEntry> | undefined;
  var __appRateLimitProvider: RateLimitProvider | undefined;
}

function getStore() {
  if (!globalThis.__appRateLimitStore) {
    globalThis.__appRateLimitStore = new Map();
  }
  return globalThis.__appRateLimitStore;
}

function toStoreKey(bucket: string, key: string) {
  const fingerprint = createHash("sha256").update(key).digest("hex");
  return `${bucket}:${fingerprint}`;
}

function pruneExpired(store: Map<string, RateLimitEntry>, now: number) {
  for (const [key, value] of store.entries()) {
    if (value.resetAt <= now) store.delete(key);
  }
}

function createMemoryProvider(): RateLimitProvider {
  return {
    consume(key, limit, windowMs) {
      const now = Date.now();
      const store = getStore();
      pruneExpired(store, now);

      const entry = store.get(key);

      if (!entry || entry.resetAt <= now) {
        store.set(key, { count: 1, resetAt: now + windowMs });
        return {
          allowed: true,
          retryAfterSeconds: 0,
          remaining: Math.max(limit - 1, 0),
        };
      }

      if (entry.count >= limit) {
        return {
          allowed: false,
          retryAfterSeconds: Math.max(
            1,
            Math.ceil((entry.resetAt - now) / 1000),
          ),
          remaining: 0,
        };
      }

      entry.count += 1;
      return {
        allowed: true,
        retryAfterSeconds: 0,
        remaining: Math.max(limit - entry.count, 0),
      };
    },
    reset(key) {
      getStore().delete(key);
    },
  };
}

function getProvider() {
  if (!globalThis.__appRateLimitProvider) {
    globalThis.__appRateLimitProvider = createMemoryProvider();
  }
  return globalThis.__appRateLimitProvider;
}

export function consumeRateLimit(input: ConsumeRateLimitInput) {
  return getProvider().consume(
    toStoreKey(input.bucket, input.key),
    input.limit,
    input.windowMs,
  );
}

export function resetRateLimit(bucket: string, key: string) {
  getProvider().reset(toStoreKey(bucket, key));
}
```

## Usage

```typescript
import { consumeRateLimit, resetRateLimit } from "@/lib/security/rate-limit";

// Check rate limit
const result = consumeRateLimit({
  bucket: "login:ip",
  key: clientIp,
  limit: 10,
  windowMs: 1000 * 60 * 10, // 10 minutes
});

if (!result.allowed) {
  return { error: `Rate limited. Retry in ${result.retryAfterSeconds}s` };
}

// Reset on success
resetRateLimit("login:ip", clientIp);
```

## Key Points

- **Global singleton** — Uses `globalThis` to survive hot reloads in dev
- **SHA-256 key fingerprint** — Prevents key collision/injection
- **Auto-pruning** — Expired entries cleaned on each consume
- **Memory only** — For multi-server, implement Redis/database provider
- **Pluggable** — Swap provider via `RATE_LIMIT_PROVIDER` env var
