# Password Management

## Implementation

```typescript
import bcrypt from "bcryptjs";
import { randomInt } from "node:crypto";

const LOWERCASE_CHARS = "abcdefghijkmnopqrstuvwxyz";
const UPPERCASE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ";
const NUMBER_CHARS = "23456789";
const SYMBOL_CHARS = "!@#$%^&*";
const PASSWORD_ALPHABET =
  LOWERCASE_CHARS + UPPERCASE_CHARS + NUMBER_CHARS + SYMBOL_CHARS;

function randomChar(source: string) {
  return source[randomInt(0, source.length)];
}

function shuffleChars(chars: string[]) {
  for (let i = chars.length - 1; i > 0; i--) {
    const swapIndex = randomInt(0, i + 1);
    [chars[i], chars[swapIndex]] = [chars[swapIndex], chars[i]];
  }
  return chars;
}

export function generatePassword(length = 12) {
  const targetLength = Math.max(length, 8);
  const chars = [
    randomChar(LOWERCASE_CHARS),
    randomChar(UPPERCASE_CHARS),
    randomChar(NUMBER_CHARS),
    randomChar(SYMBOL_CHARS),
  ];
  while (chars.length < targetLength) {
    chars.push(randomChar(PASSWORD_ALPHABET));
  }
  return shuffleChars(chars).join("");
}

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(
  password: string,
  passwordHash: string,
) {
  if (!password || !passwordHash) return false;
  return bcrypt.compare(password, passwordHash);
}
```

## Key Points

- **`bcryptjs`** — Pure JS bcrypt, works everywhere (no native deps)
- **Cost factor 10** — Good balance of security and performance
- **Early null check** in `verifyPassword` — avoids bcrypt edge cases
- **`generatePassword`** — Crypto-secure random with guaranteed char classes
- **Ambiguous chars excluded** — No `0/O`, `1/l/I` in alphabet
