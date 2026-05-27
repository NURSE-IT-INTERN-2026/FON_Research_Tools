-- CreateEnum
CREATE TYPE "BorrowingStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "ActivityAction" ADD VALUE 'BORROW_SUBMIT';
ALTER TYPE "ActivityAction" ADD VALUE 'BORROW_APPROVE';
ALTER TYPE "ActivityAction" ADD VALUE 'BORROW_REJECT';
ALTER TYPE "ActivityAction" ADD VALUE 'BORROW_REMOVE';

-- AlterTable
ALTER TABLE "Document" ADD COLUMN     "instrumentId" TEXT;

-- CreateTable
CREATE TABLE "Instrument" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Instrument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BorrowingRecord" (
    "id" TEXT NOT NULL,
    "instrumentId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "requesterName" TEXT,
    "requestDate" TIMESTAMP(3),
    "additionalDetails" TEXT,
    "licenseFileName" TEXT,
    "licenseOriginalName" TEXT,
    "licenseFileSize" INTEGER,
    "status" "BorrowingStatus" NOT NULL DEFAULT 'PENDING',
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "adminNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BorrowingRecord_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Instrument_name_key" ON "Instrument"("name");

-- CreateIndex
CREATE INDEX "BorrowingRecord_instrumentId_idx" ON "BorrowingRecord"("instrumentId");

-- CreateIndex
CREATE INDEX "BorrowingRecord_userId_idx" ON "BorrowingRecord"("userId");

-- CreateIndex
CREATE INDEX "BorrowingRecord_status_idx" ON "BorrowingRecord"("status");

-- CreateIndex
CREATE INDEX "BorrowingRecord_createdAt_idx" ON "BorrowingRecord"("createdAt");

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_instrumentId_fkey" FOREIGN KEY ("instrumentId") REFERENCES "Instrument"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BorrowingRecord" ADD CONSTRAINT "BorrowingRecord_instrumentId_fkey" FOREIGN KEY ("instrumentId") REFERENCES "Instrument"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BorrowingRecord" ADD CONSTRAINT "BorrowingRecord_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
