# Data Model

PostgreSQL via Prisma 7.

---

## Enums

```prisma
enum AppRole {
  ADMIN
  BORROWER
}

enum ToolStatus {
  AVAILABLE
  BORROWED
  MAINTENANCE
}

enum BookingStatus {
  PENDING
  APPROVED
  REJECTED
  RETURNED
  OVERDUE
}
```

---

## Models

### User (managed by auth provider)

Auth is handled separately. The app references user identity from the session, not from a self-managed `users` table.

### Profile

```prisma
model Profile {
  id         String    @id                       // Matches auth user ID
  name       String
  email      String    @unique
  department String?
  createdAt  DateTime  @default(now())
  updatedAt  DateTime  @updatedAt

  userRoles UserRole[]
  bookings  Booking[]
}
```

### UserRole

```prisma
model UserRole {
  id      String  @id @default(cuid())
  userId  String
  role    AppRole
  profile Profile @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([userId, role])
}
```

### Tool

```prisma
model Tool {
  id           String     @id @default(cuid())
  name         String
  description  String     @default("")
  category     String     @default("General")
  serialNumber String     @unique
  imageUrl     String?
  status       ToolStatus @default(AVAILABLE)
  location     String     @default("")
  createdAt    DateTime   @default(now())
  updatedAt    DateTime   @updatedAt

  bookings Booking[]
}
```

### Booking

```prisma
model Booking {
  id         String        @id @default(cuid())
  userId     String
  toolId     String
  startDate  DateTime
  endDate    DateTime
  purpose    String
  status     BookingStatus @default(PENDING)
  adminNotes String?
  createdAt  DateTime      @default(now())
  updatedAt  DateTime      @updatedAt

  profile Profile @relation(fields: [userId], references: [id], onDelete: Cascade)
  tool    Tool     @relation(fields: [toolId], references: [id], onDelete: Cascade)
}
```

---

## Relations Summary

```
Profile 1──N UserRole
Profile 1──N Booking
Tool    1──N Booking
```

---

## Indexes (beyond defaults)

- `Profile.email` — unique lookup
- `Tool.serialNumber` — unique lookup
- `Booking.userId` — borrower's bookings query
- `Booking.toolId` — tool's booking history
- `Booking.status` — filtered queries (pending, overdue)
- `UserRole.userId + role` — unique compound (enforced by `@@unique`)

---

## Seed Data (Dev)

Docker Compose should seed:
- 2 admin profiles + roles
- 4 borrower profiles + roles
- 8–10 tools across 4–5 categories
- 10–15 bookings across all statuses

No mock data in application code — seed the database instead.
