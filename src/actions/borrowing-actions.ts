"use server";

import { revalidatePath } from "next/cache";
import { requireAuth, requireRole } from "@/lib/auth";
import { logActivity } from "@/lib/activity-log";
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

export async function submitBorrowRequest(
  _prev: BorrowingActionState,
  formData: FormData,
): Promise<BorrowingActionState> {
  const { userId } = await requireRole("STUDENT");

  const instrumentId = (formData.get("instrumentId") as string)?.trim();
  const requesterName = (formData.get("requesterName") as string)?.trim();
  const requestDateStr = (formData.get("requestDate") as string)?.trim();
  const additionalDetails = (formData.get("additionalDetails") as string)?.trim();
  const file = formData.get("licenseFile");

  if (!instrumentId) return { error: "กรุณาเลือกเครื่องมือวิจัย" };
  if (!requesterName) return { error: "กรุณากรอกชื่อผู้ขอ" };
  if (!requestDateStr) return { error: "กรุณากรอกวันที่ขอ" };

  const instrument = await db.instrument.findUnique({ where: { id: instrumentId } });
  if (!instrument) return { error: "ไม่พบเครื่องมือวิจัยที่เลือก" };

  if (!file || !(file instanceof File) || file.size === 0)
    return { error: "กรุณาเลือกไฟล์ใบอนุญาต (PDF)" };
  if (file.type !== "application/pdf")
    return { error: "อัปโหลดไฟล์ PDF เท่านั้น" };
  if (file.size > MAX_FILE_SIZE)
    return { error: "ไฟล์มีขนาดเกิน 10 MB" };

  const record = await db.borrowingRecord.create({
    data: {
      instrumentId,
      userId,
      requesterName,
      requestDate: new Date(requestDateStr),
      additionalDetails: additionalDetails || null,
    },
  });

  if (!existsSync(UPLOAD_DIR)) {
    await mkdir(UPLOAD_DIR, { recursive: true });
  }

  const licenseFileName = `${record.id}.pdf`;
  const filePath = join(UPLOAD_DIR, licenseFileName);
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(filePath, buffer);

  await db.borrowingRecord.update({
    where: { id: record.id },
    data: {
      licenseFileName,
      licenseOriginalName: file.name,
      licenseFileSize: file.size,
    },
  });

  await logActivity({
    action: "BORROW_SUBMIT",
    userId,
    targetType: "BorrowingRecord",
    targetId: record.id,
    targetLabel: `${requesterName} → ${instrument.name}`,
  });

  revalidatePath("/borrow");
  return { success: true };
}

export async function approveBorrowing(
  recordId: string,
): Promise<BorrowingActionState> {
  const ctx = await requireRole("ADMIN");

  const record = await db.borrowingRecord.findUnique({
    where: { id: recordId },
    include: { instrument: true },
  });
  if (!record) return { error: "ไม่พบคำขอยืม" };
  if (record.status !== "PENDING") return { error: "คำขอนี้ถูกดำเนินการแล้ว" };

  await db.borrowingRecord.update({
    where: { id: recordId },
    data: {
      status: "APPROVED",
      approvedBy: ctx.userId,
      approvedAt: new Date(),
    },
  });

  await logActivity({
    action: "BORROW_APPROVE",
    userId: ctx.userId,
    targetType: "BorrowingRecord",
    targetId: recordId,
    targetLabel: `${record.requesterName} → ${record.instrument.name}`,
  });

  revalidatePath("/admin/borrowing");
  return { success: true };
}

export async function rejectBorrowing(
  recordId: string,
  notes: string,
): Promise<BorrowingActionState> {
  const ctx = await requireRole("ADMIN");

  const record = await db.borrowingRecord.findUnique({
    where: { id: recordId },
    include: { instrument: true },
  });
  if (!record) return { error: "ไม่พบคำขอยืม" };
  if (record.status !== "PENDING") return { error: "คำขอนี้ถูกดำเนินการแล้ว" };

  await db.borrowingRecord.update({
    where: { id: recordId },
    data: {
      status: "REJECTED",
      approvedBy: ctx.userId,
      approvedAt: new Date(),
      adminNotes: notes,
    },
  });

  await logActivity({
    action: "BORROW_REJECT",
    userId: ctx.userId,
    targetType: "BorrowingRecord",
    targetId: recordId,
    targetLabel: `${record.requesterName} → ${record.instrument.name}`,
  });

  revalidatePath("/admin/borrowing");
  return { success: true };
}

export async function removeBorrowing(
  _prev: BorrowingActionState,
  formData: FormData,
): Promise<BorrowingActionState> {
  const { userId } = await requireAuth();
  const recordId = formData.get("recordId") as string;

  if (!recordId) return { error: "ไม่พบคำขอยืม" };

  const record = await db.borrowingRecord.findUnique({
    where: { id: recordId },
    include: { instrument: true },
  });
  if (!record) return { error: "ไม่พบคำขอยืม" };

  const actor = await db.profile.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  const isAdmin = actor?.role === "ADMIN";
  const isOwner = record.userId === userId;

  if (!isAdmin && !isOwner) return { error: "ไม่มีสิทธิ์ลบคำขอนี้" };
  if (!isAdmin && record.status !== "PENDING")
    return { error: "ลบได้เฉพาะคำขอที่รอตรวจสอบ" };

  // Delete license file
  if (record.licenseFileName) {
    const filePath = join(UPLOAD_DIR, record.licenseFileName);
    if (existsSync(filePath)) {
      await unlink(filePath);
    }
  }

  await db.borrowingRecord.delete({ where: { id: recordId } });

  await logActivity({
    action: "BORROW_REMOVE",
    userId,
    targetType: "BorrowingRecord",
    targetId: recordId,
    targetLabel: `${record.requesterName ?? "—"} → ${record.instrument.name}`,
  });

  revalidatePath("/borrow");
  revalidatePath("/admin/borrowing");
  return { success: true };
}
