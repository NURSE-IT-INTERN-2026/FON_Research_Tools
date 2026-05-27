-- Rename approvedAt/approvedBy to reviewedAt/reviewedBy in Document
ALTER TABLE "Document" RENAME COLUMN "approvedAt" TO "reviewedAt";
ALTER TABLE "Document" RENAME COLUMN "approvedBy" TO "reviewedBy";

-- Rename approvedAt/approvedBy to reviewedAt/reviewedBy in BorrowingRecord
ALTER TABLE "BorrowingRecord" RENAME COLUMN "approvedAt" TO "reviewedAt";
ALTER TABLE "BorrowingRecord" RENAME COLUMN "approvedBy" TO "reviewedBy";
