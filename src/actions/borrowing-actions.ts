"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
import db from "@/lib/db";
import { writeFile, mkdir, unlink } from "node:fs/promises";
import { join } from "node:path";
import { existsSync } from "node:fs";

const UPLOAD_DIR = join(process.cwd(), "uploads", "borrowing");
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

export type BorrowingActionState = {
  success?: boolean;
  error?: string;
};

async function saveFile(file: File, suffix: string, recordId: string) {
  if (!existsSync(UPLOAD_DIR)) {
    await mkdir(UPLOAD_DIR, { recursive: true });
  }
  const fileName = `${recordId}_${suffix}.pdf`;
  const filePath = join(UPLOAD_DIR, fileName);
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(filePath, buffer);
  return { fileName, originalName: file.name, fileSize: file.size };
}

export async function createBorrowingRecord(
  _prev: BorrowingActionState,
  formData: FormData,
): Promise<BorrowingActionState> {
  const ctx = await requireRole("ADMIN");

  const ownerUserId = (formData.get("ownerUserId") as string)?.trim();
  const requesterName = (formData.get("requesterName") as string)?.trim();
  const requestDateStr = (formData.get("requestDate") as string)?.trim();
  const source = (formData.get("source") as string)?.trim();
  const additionalDetails = (formData.get("additionalDetails") as string)?.trim() || null;
  const licenseFile = formData.get("licenseFile");
  const certificateFile = formData.get("certificateFile");

  if (!ownerUserId) return { error: "กรุณาเลือกเจ้าของเครื่องมือ" };
  if (!requesterName) return { error: "กรุณากรอกชื่อผู้ขอใช้" };
  if (!source) return { error: "กรุณากรอกเรียนจากที่ไหน" };

  const owner = await db.profile.findUnique({ where: { id: ownerUserId } });
  if (!owner) return { error: "ไม่พบเจ้าของเครื่องมือในระบบ" };

  // Create record + increment owner's borrowCount atomically so the count
  // never drifts even if the request fails between writes.
  const record = await db.$transaction(async (tx) => {
    const created = await tx.borrowingRecord.create({
      data: {
        ownerUserId,
        requesterName,
        requestDate: requestDateStr ? new Date(requestDateStr) : null,
        source,
        additionalDetails,
        createdBy: ctx.userId,
      },
    });
    await tx.profile.update({
      where: { id: ownerUserId },
      data: { borrowCount: { increment: 1 } },
    });
    return created;
  });

  // Save license file (ใบอนุญาตจากสำนักทะเบียน)
  if (licenseFile && licenseFile instanceof File && licenseFile.size > 0) {
    if (licenseFile.type !== "application/pdf")
      return { error: "ใบอนุญาตต้องเป็นไฟล์ PDF เท่านั้น" };
    if (licenseFile.size > MAX_FILE_SIZE)
      return { error: "ไฟล์ใบอนุญาตมีขนาดเกิน 10 MB" };

    const saved = await saveFile(licenseFile, "license", record.id);
    await db.borrowingRecord.update({
      where: { id: record.id },
      data: {
        licenseFileName: saved.fileName,
        licenseOriginalName: saved.originalName,
        licenseFileSize: saved.fileSize,
      },
    });
  }

  // Save certificate file (ใบรับรอง)
  if (certificateFile && certificateFile instanceof File && certificateFile.size > 0) {
    if (certificateFile.type !== "application/pdf")
      return { error: "ใบรับรองต้องเป็นไฟล์ PDF เท่านั้น" };
    if (certificateFile.size > MAX_FILE_SIZE)
      return { error: "ไฟล์ใบรับรองมีขนาดเกิน 10 MB" };

    const saved = await saveFile(certificateFile, "certificate", record.id);
    await db.borrowingRecord.update({
      where: { id: record.id },
      data: {
        certificateFileName: saved.fileName,
        certificateOriginalName: saved.originalName,
        certificateFileSize: saved.fileSize,
      },
    });
  }

  revalidatePath("/admin/borrowing");
  return { success: true };
}

export async function updateBorrowingRecord(
  _prev: BorrowingActionState,
  formData: FormData,
): Promise<BorrowingActionState> {
  await requireRole("ADMIN");

  const recordId = formData.get("recordId") as string;
  const ownerUserId = (formData.get("ownerUserId") as string)?.trim();
  const requesterName = (formData.get("requesterName") as string)?.trim();
  const requestDateStr = (formData.get("requestDate") as string)?.trim();
  const source = (formData.get("source") as string)?.trim();
  const additionalDetails = (formData.get("additionalDetails") as string)?.trim() || null;
  const licenseFile = formData.get("licenseFile");
  const certificateFile = formData.get("certificateFile");
  const removeLicense = formData.get("removeLicense") === "true";
  const removeCertificate = formData.get("removeCertificate") === "true";

  if (!recordId) return { error: "ไม่พบรายการ" };
  if (!ownerUserId) return { error: "กรุณาเลือกเจ้าของเครื่องมือ" };
  if (!requesterName) return { error: "กรุณากรอกชื่อผู้ขอใช้" };
  if (!source) return { error: "กรุณากรอกเรียนจากที่ไหน" };

  const record = await db.borrowingRecord.findUnique({ where: { id: recordId } });
  if (!record) return { error: "ไม่พบรายการ" };

  // If the owner is being changed, move the borrowCount between owners
  // atomically so the totals stay correct.
  const ownerChanged = record.ownerUserId !== ownerUserId;
  await db.$transaction(async (tx) => {
    await tx.borrowingRecord.update({
      where: { id: recordId },
      data: {
        ownerUserId,
        requesterName,
        requestDate: requestDateStr ? new Date(requestDateStr) : null,
        source,
        additionalDetails,
      },
    });
    if (ownerChanged) {
      await tx.profile.update({
        where: { id: record.ownerUserId },
        data: { borrowCount: { decrement: 1 } },
      });
      await tx.profile.update({
        where: { id: ownerUserId },
        data: { borrowCount: { increment: 1 } },
      });
    }
  });

  // Update license file
  if (licenseFile && licenseFile instanceof File && licenseFile.size > 0) {
    if (licenseFile.type !== "application/pdf")
      return { error: "ใบอนุญาตต้องเป็นไฟล์ PDF เท่านั้น" };
    if (licenseFile.size > MAX_FILE_SIZE)
      return { error: "ไฟล์ใบอนุญาตมีขนาดเกิน 10 MB" };

    if (record.licenseFileName) {
      const oldPath = join(UPLOAD_DIR, record.licenseFileName);
      if (existsSync(oldPath)) await unlink(oldPath);
    }
    const saved = await saveFile(licenseFile, "license", recordId);
    await db.borrowingRecord.update({
      where: { id: recordId },
      data: {
        licenseFileName: saved.fileName,
        licenseOriginalName: saved.originalName,
        licenseFileSize: saved.fileSize,
      },
    });
  } else if (removeLicense && record.licenseFileName) {
    // User clicked "X" on the current file in edit mode and did not pick a
    // replacement — delete the old file from disk + clear DB fields.
    const oldPath = join(UPLOAD_DIR, record.licenseFileName);
    if (existsSync(oldPath)) await unlink(oldPath);
    await db.borrowingRecord.update({
      where: { id: recordId },
      data: {
        licenseFileName: null,
        licenseOriginalName: null,
        licenseFileSize: null,
      },
    });
  }

  // Update certificate file
  if (certificateFile && certificateFile instanceof File && certificateFile.size > 0) {
    if (certificateFile.type !== "application/pdf")
      return { error: "ใบรับรองต้องเป็นไฟล์ PDF เท่านั้น" };
    if (certificateFile.size > MAX_FILE_SIZE)
      return { error: "ไฟล์ใบรับรองมีขนาดเกิน 10 MB" };

    if (record.certificateFileName) {
      const oldPath = join(UPLOAD_DIR, record.certificateFileName);
      if (existsSync(oldPath)) await unlink(oldPath);
    }
    const saved = await saveFile(certificateFile, "certificate", recordId);
    await db.borrowingRecord.update({
      where: { id: recordId },
      data: {
        certificateFileName: saved.fileName,
        certificateOriginalName: saved.originalName,
        certificateFileSize: saved.fileSize,
      },
    });
  } else if (removeCertificate && record.certificateFileName) {
    const oldPath = join(UPLOAD_DIR, record.certificateFileName);
    if (existsSync(oldPath)) await unlink(oldPath);
    await db.borrowingRecord.update({
      where: { id: recordId },
      data: {
        certificateFileName: null,
        certificateOriginalName: null,
        certificateFileSize: null,
      },
    });
  }

  revalidatePath("/admin/borrowing");
  return { success: true };
}

export async function removeBorrowing(
  _prev: BorrowingActionState,
  formData: FormData,
): Promise<BorrowingActionState> {
  await requireRole("ADMIN");
  const recordId = formData.get("recordId") as string;

  if (!recordId) return { error: "ไม่พบรายการ" };

  const record = await db.borrowingRecord.findUnique({
    where: { id: recordId },
    include: { owner: true },
  });
  if (!record) return { error: "ไม่พบรายการ" };

  // Delete files
  if (record.licenseFileName) {
    const filePath = join(UPLOAD_DIR, record.licenseFileName);
    if (existsSync(filePath)) await unlink(filePath);
  }
  if (record.certificateFileName) {
    const filePath = join(UPLOAD_DIR, record.certificateFileName);
    if (existsSync(filePath)) await unlink(filePath);
  }

  // Delete record + decrement owner's borrowCount atomically.
  await db.$transaction(async (tx) => {
    await tx.borrowingRecord.delete({ where: { id: recordId } });
    await tx.profile.update({
      where: { id: record.ownerUserId },
      data: { borrowCount: { decrement: 1 } },
    });
  });

  revalidatePath("/admin/borrowing");
  return { success: true };
}
