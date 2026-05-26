-- Step 1: Add role column to Profile with default STUDENT
ALTER TABLE "Profile" ADD COLUMN "role" "AppRole" NOT NULL DEFAULT 'STUDENT';

-- Step 2: Copy role from UserRole to Profile
UPDATE "Profile" SET "role" = "UserRole"."role"
FROM "UserRole"
WHERE "UserRole"."userId" = "Profile"."id";

-- Step 3: Drop UserRole table
DROP TABLE "UserRole";

-- Step 4: Drop UserRole enum if it was separate (it's shared AppRole, so no need)
