"use server";

import { revalidatePath } from "next/cache";
import { requireAuth, requireRole } from "@/lib/auth";
import { logActivity } from "@/lib/activity-log";
import { sendEmail } from "@/lib/email";
import db from "@/lib/db";
import { writeFile, mkdir, unlink } from "node:fs/promises";
import { join } from "node:path";
import { existsSync } from "node:fs";

const UPLOAD_DIR = join(process.cwd(), "uploads");
const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100 MB

export type UploadDocumentState = {
  success?: boolean;
  error?: string;
};

export async function uploadDocument(
  _prev: UploadDocumentState,
  formData: FormData,
): Promise<UploadDocumentState> {
  const { userId } = await requireRole("STUDENT");

  const title = (formData.get("title") as string)?.trim();
  const file = formData.get("file") as File | null;

  if (!title) return { error: "กรุณากรอกชื่อเครื่องมือวิจัย" };
  if (!file) return { error: "กรุณาเลือกไฟล์ PDF" };
  if (file.type !== "application/pdf") return { error: "อัปโหลดไฟล์ PDF เท่านั้น" };
  if (file.size > MAX_FILE_SIZE) return { error: "ไฟล์มีขนาดเกิน 100 MB" };

  const profile = await db.profile.findUnique({
    where: { id: userId },
    select: { name: true, studentId: true },
  });

  const studentFolder = profile?.studentId ?? userId;
  const folderPath = join(UPLOAD_DIR, studentFolder);

  if (!existsSync(folderPath)) {
    await mkdir(folderPath, { recursive: true });
  }

  const timestamp = Date.now();
  const fileName = `${studentFolder}_${timestamp}.pdf`;
  const filePath = join(folderPath, fileName);

  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(filePath, buffer);

  const doc = await db.document.create({
    data: {
      userId,
      title,
      fileName,
      originalName: file.name,
      fileSize: file.size,
    },
  });

  await logActivity({
    action: "DOCUMENT_UPLOAD",
    userId,
    targetType: "Document",
    targetId: doc.id,
    targetLabel: title,
  });

  revalidatePath("/thesis");
  return { success: true };
}

export async function removeDocument(
  _prev: UploadDocumentState,
  formData: FormData,
): Promise<UploadDocumentState> {
  const { userId } = await requireAuth();
  const documentId = formData.get("documentId") as string;

  if (!documentId) return { error: "ไม่พบเอกสาร" };

  const doc = await db.document.findUnique({ where: { id: documentId } });
  if (!doc) return { error: "ไม่พบเอกสาร" };

  const userRole = await db.userRole.findUnique({ where: { userId } });
  const isAdmin = userRole?.role === "ADMIN";
  const isOwner = doc.userId === userId;

  if (!isAdmin && !isOwner) return { error: "ไม่มีสิทธิ์ลบเอกสารนี้" };
  if (!isAdmin && doc.status !== "PENDING") return { error: "ลบได้เฉพาะเอกสารที่ยังรอตรวจสอบ" };

  // Delete file from disk
  const profile = await db.profile.findUnique({
    where: { id: doc.userId },
    select: { studentId: true },
  });
  const studentFolder = profile?.studentId ?? doc.userId;
  const filePath = join(UPLOAD_DIR, studentFolder, doc.fileName);
  if (existsSync(filePath)) {
    await unlink(filePath);
  }

  await db.document.delete({ where: { id: documentId } });

  await logActivity({
    action: "DOCUMENT_REMOVE",
    userId,
    targetType: "Document",
    targetId: documentId,
    targetLabel: doc.title,
  });

  revalidatePath("/thesis");
  revalidatePath("/admin/documents");
  return { success: true };
}

export async function approveDocument(
  documentId: string,
): Promise<UploadDocumentState> {
  const ctx = await requireRole("ADMIN");

  const doc = await db.document.findUnique({ where: { id: documentId } });
  if (!doc) return { error: "ไม่พบเอกสาร" };
  if (doc.status !== "PENDING") return { error: "เอกสารนี้ถูกดำเนินการแล้ว" };

  await db.document.update({
    where: { id: documentId },
    data: {
      status: "APPROVED",
      approvedBy: ctx.userId,
      approvedAt: new Date(),
    },
  });

  await logActivity({
    action: "DOCUMENT_APPROVE",
    userId: ctx.userId,
    targetType: "Document",
    targetId: documentId,
    targetLabel: doc.title,
  });

  // Notify student only when all their documents are approved
  const remainingPending = await db.document.count({
    where: { userId: doc.userId, status: "PENDING" },
  });
  if (remainingPending === 0) {
    const studentProfile = await db.profile.findUnique({
      where: { id: doc.userId },
      select: { email: true, name: true },
    });
    if (studentProfile?.email) {
      const appUrl = process.env.APP_URL ?? "http://localhost:4141/researchtool";
      sendEmail({
        subject: "แจ้งผลการพิจารณาวิทยานิพนธ์",
        sentTo: studentProfile.email,
        message: `เรียนนักศึกษา\n\nแจ้งผลการพิจารณาเรียบร้อยแล้ว\n\nขอแสดงความนับถือ\nดูรายละเอียดได้ที่: ${appUrl}/thesis`,
      }).catch(() => {});
    }
  }

  revalidatePath("/admin/documents");
  return { success: true };
}

export async function rejectDocument(
  documentId: string,
  notes: string,
): Promise<UploadDocumentState> {
  const ctx = await requireRole("ADMIN");

  const doc = await db.document.findUnique({ where: { id: documentId } });
  if (!doc) return { error: "ไม่พบเอกสาร" };
  if (doc.status !== "PENDING") return { error: "เอกสารนี้ถูกดำเนินการแล้ว" };

  await db.document.update({
    where: { id: documentId },
    data: {
      status: "REJECTED",
      approvedBy: ctx.userId,
      approvedAt: new Date(),
      adminNotes: notes,
    },
  });

  await logActivity({
    action: "DOCUMENT_REJECT",
    userId: ctx.userId,
    targetType: "Document",
    targetId: documentId,
    targetLabel: doc.title,
  });

  // Notify student immediately on rejection
  const studentProfile = await db.profile.findUnique({
    where: { id: doc.userId },
    select: { email: true, name: true },
  });
  if (studentProfile?.email) {
    const appUrl = process.env.APP_URL ?? "http://localhost:4141/researchtool";
    sendEmail({
      subject: "แจ้งผลการพิจารณาวิทยานิพนธ์",
      sentTo: studentProfile.email,
      message: `เรียนนักศึกษา\n\nเอกสาร "${doc.title}" ไม่ได้รับการอนุมัติ\nเหตุผล: ${notes}\n\nกรุณาแก้ไขและอัปโหลดใหม่\n\nขอแสดงความนับถือ\nดูรายละเอียดได้ที่: ${appUrl}/thesis`,
    }).catch(() => {});
  }

  revalidatePath("/admin/documents");
  return { success: true };
}

export async function approveAllStudentPending(
  studentUserId: string,
): Promise<{ success?: boolean; error?: string; count?: number }> {
  const ctx = await requireRole("ADMIN");

  const pending = await db.document.findMany({
    where: { userId: studentUserId, status: "PENDING" },
    select: { id: true, title: true },
  });

  if (pending.length === 0) return { error: "ไม่มีเอกสารที่รอตรวจสอบ" };

  const now = new Date();
  await db.document.updateMany({
    where: { userId: studentUserId, status: "PENDING" },
    data: {
      status: "APPROVED",
      approvedBy: ctx.userId,
      approvedAt: now,
    },
  });

  for (const doc of pending) {
    await logActivity({
      action: "DOCUMENT_APPROVE",
      userId: ctx.userId,
      targetType: "Document",
      targetId: doc.id,
      targetLabel: doc.title,
    });
  }

  // Notify student immediately
  const studentProfile = await db.profile.findUnique({
    where: { id: studentUserId },
    select: { email: true, name: true },
  });
  if (studentProfile?.email) {
    const appUrl = process.env.APP_URL ?? "http://localhost:4141/researchtool";
    sendEmail({
      subject: "แจ้งผลการพิจารณาวิทยานิพนธ์",
      sentTo: studentProfile.email,
      message: `เรียนนักศึกษา\n\nแจ้งผลการพิจารณาเรียบร้อยแล้ว\n\nขอแสดงความนับถือ\nดูรายละเอียดได้ที่: ${appUrl}/thesis`,
    }).catch(() => {});
  }

  revalidatePath("/admin/documents");
  return { success: true, count: pending.length };
}
