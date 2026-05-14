# Data Model

PostgreSQL via Prisma 7. Auth identity managed by Supabase; application data managed by Prisma.

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

### User (managed by Supabase Auth)

Auth identity lives in Supabase. The app references the user ID from the session cookie. No self-managed `users` table.

### Profile

```prisma
model Profile {
  id         String    @id                       // Matches Supabase auth user ID
  name       String
  email      String    @unique
  department String?
  createdAt  DateTime  @default(now())
  updatedAt  DateTime  @updatedAt

  userRole  UserRole?
  bookings  Booking[]
}
```

### UserRole

```prisma
model UserRole {
  id      String  @id @default(cuid())
  userId  String  @unique
  role    AppRole
  profile Profile @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```

`userId` is `@unique` so each user has exactly one role. The schema-level constraint makes the one-role-per-user rule enforceable by the database, not just the application layer.

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
  isActive     Boolean    @default(true)
  createdAt    DateTime   @default(now())
  updatedAt    DateTime   @updatedAt

  bookings Booking[]
}
```

`isActive` soft-delete flag. Admin can deactivate a tool (hides it from the borrower catalog). Tools with booking history are deactivated, never hard-deleted, to preserve referential integrity. Tools with zero bookings can optionally be hard-deleted.

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
  returnDate DateTime?                          // Actual return date (set when admin marks returned)
  createdAt  DateTime      @default(now())
  updatedAt  DateTime      @updatedAt

  profile Profile @relation(fields: [userId], references: [id], onDelete: Cascade)
  tool    Tool     @relation(fields: [toolId], references: [id], onDelete: Cascade)
}
```

---

## Relations Summary

```
Profile 1──1 UserRole  (userId @unique)
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
- `UserRole.userId` — unique lookup (enforced by `@unique`)

---

## PostgreSQL Trigger

`handle_new_user` trigger fires after Supabase Auth creates a new user. Defined as a raw SQL migration, not managed by Prisma.

**Migration order matters:** This trigger must be created **after** Prisma has created the `Profile` table, `UserRole` table, and `AppRole` enum. Run `npx prisma migrate dev` first to create the public schema, then apply the trigger migration separately. The trigger function references `"AppRole"` as a cast target — it will fail if the enum does not exist yet.

```sql
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO "Profile" (id, name, email, department)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'name',
    NEW.email,
    NEW.raw_user_meta_data->>'department'
  );
  INSERT INTO "UserRole" ("userId", role)
  VALUES (
    NEW.id,
    (NEW.raw_user_meta_data->>'role')::"AppRole"
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
```

---

## Seed Data (Dev)

Docker Compose seeds the database via `prisma/seed.ts`:

- 2 admin profiles + roles
- 4 borrower profiles + roles
- 8–10 tools across 4–5 categories
- 10–15 bookings across all statuses

No mock data in application code — seed the database instead.
