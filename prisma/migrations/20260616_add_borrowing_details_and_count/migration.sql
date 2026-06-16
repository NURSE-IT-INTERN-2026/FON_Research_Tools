-- Add additionalDetails to BorrowingRecord
ALTER TABLE "BorrowingRecord" ADD COLUMN "additionalDetails" TEXT;

-- Add borrowCount to Profile (default 0)
ALTER TABLE "Profile" ADD COLUMN "borrowCount" INTEGER NOT NULL DEFAULT 0;

-- Backfill borrowCount from existing records
UPDATE "Profile" p
SET "borrowCount" = COALESCE(
  (SELECT COUNT(*) FROM "BorrowingRecord" b WHERE b."ownerUserId" = p."id"),
  0
);
