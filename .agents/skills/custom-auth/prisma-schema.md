# Prisma Schema — User & Roles

## Model

```prisma
enum UserRole {
  super_admin
  admin
  student
}

model User {
  id           String   @id @default(uuid()) @db.Uuid
  email        String   @unique @db.VarChar(255)
  passwordHash String   @db.VarChar(255)
  role         UserRole
  name         String?  @db.VarChar(255)
  createdById  String?  @db.Uuid
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  // Relations (add as needed per project)
  // studentProfile  Student?
  // createdUsers    User[]  @relation("UserCreatedUsers")

  @@map("users")
}

model Student {
  id            String    @id @default(uuid()) @db.Uuid
  userId        String    @unique @db.Uuid
  firstName     String?
  lastName      String?
  tosAcceptedAt DateTime?
  user          User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("students")
}
```

## Customization

1. **Roles** — Add/remove values in `UserRole` enum as needed
2. **Profile models** — Add role-specific profile models (like `Student`)
3. **Relations** — Add `createdUsers` self-relation if admins create other users
4. **Fields** — Add `lastLoginAt`, `avatarUrl`, etc. per project requirements
