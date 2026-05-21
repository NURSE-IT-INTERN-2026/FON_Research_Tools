"use server";

import { revalidatePath } from "next/cache";
import { requireAuth, requireRole } from "@/lib/auth";
import { logActivity } from "@/lib/activity-log";
import { sendEmail, getAdminEmails } from "@/lib/email";
import db from "@/lib/db";
import { writeFile, mkdir, unlink } from "node:fs/promises";
import { join } from "node:path";
import { existsSync } from "node:fs";

const UPLOAD_DIR = join(process.cwd(), "uploads");
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

export type UploadDocumentState = {
  success?: boolean;
  error?: string;
};

export async function uploadDocuments(
  _prev: UploadDocumentState,
  formData: FormData,
): Promise<UploadDocumentState> {
  const { userId } = await requireRole("STUDENT");

  // Read row IDs from hidden field
  const rowIdsRaw = formData.get("rowIds") as string | null;
  if (!rowIdsRaw) return { error: "กรุณาเพิ่มเอกสารอย่างน้อย 1 รายการ" };
  const rowIds = rowIdsRaw.split(",").map(Number);

  // Collect rows by their IDs
  type Row = { index: number; title: string; file: File | null };
  const rows: Row[] = rowIds.map((id) => {
    const raw = formData.get(`file_${id}`);
    const file = raw instanceof File && raw.size > 0 ? raw : null;
    return {
      index: id,
      title: (formData.get(`title_${id}`) as string)?.trim() ?? "",
      file,
    };
  });

  if (rows.length === 0) return { error: "กรุณาเพิ่มเอกสารอย่างน้อย 1 รายการ" };

  // Validate every row
  for (let r = 0; r < rows.length; r++) {
    const row = rows[r];
    const rowNum = r + 1;
    if (!row.title) return { error: `แถวที่ ${rowNum}: กรุณากรอกชื่อเครื่องมือวิจัย` };
    if (!row.file) return { error: `แถวที่ ${rowNum}: กรุณาเลือกไฟล์ PDF` };
    if (row.file.type !== "application/pdf") return { error: `แถวที่ ${rowNum}: อัปโหลดไฟล์ PDF เท่านั้น` };
    if (row.file.size > MAX_FILE_SIZE) return { error: `แถวที่ ${rowNum}: ไฟล์มีขนาดเกิน 10 MB` };
  }

  const profile = await db.profile.findUnique({
    where: { id: userId },
    select: { name: true, studentId: true, email: true },
  });

  const studentFolder = profile?.studentId ?? userId;
  const folderPath = join(UPLOAD_DIR, studentFolder);
  if (!existsSync(folderPath)) {
    await mkdir(folderPath, { recursive: true });
  }

  // After validation, all rows are guaranteed to have title and file
  const validRows = rows as (Row & { file: File })[];

  const timestamp = Date.now();
  const uploadedTitles: string[] = [];

  for (let j = 0; j < validRows.length; j++) {
    const row = validRows[j];
    const fileName = `${studentFolder}_${timestamp}_${j}.pdf`;
    const filePath = join(folderPath, fileName);

    const buffer = Buffer.from(await row.file.arrayBuffer());
    await writeFile(filePath, buffer);

    const doc = await db.document.create({
      data: {
        userId,
        title: row.title,
        fileName,
        originalName: row.file.name,
        fileSize: row.file.size,
      },
    });

    uploadedTitles.push(row.title);

    await logActivity({
      action: "DOCUMENT_UPLOAD",
      userId,
      targetType: "Document",
      targetId: doc.id,
      targetLabel: row.title,
    });
  }

  // Send ONE email to admins
  if (uploadedTitles.length > 0) {
    const adminEmails = getAdminEmails();
    const studentName = profile?.name ?? "นักศึกษา";
    const studentId = profile?.studentId ?? "—";
    const bulletList = uploadedTitles.map((t) => `• ${t}`).join("\n");
    const appUrl = process.env.APP_URL ?? "http://localhost:4141/researchtool";

    sendEmail({
      subject: "แจ้งเตือน: นักศึกษาอัปโหลดเอกสารเครื่องมือวิจัย",
      sentTo: adminEmails.to,
      ccTo: adminEmails.cc,
      message: `นักศึกษาได้อัปโหลดเอกสารเครื่องมือวิจัย\n\nชื่อ: ${studentName}\nรหัสนักศึกษา: ${studentId}\n\nเอกสารที่อัปโหลด:\n${bulletList}\n\nตรวจสอบเอกสาร: ${appUrl}`,
    }).catch(() => {});
  }

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
  if (!isAdmin && doc.status !== "PENDING" && doc.status !== "REJECTED") return { error: "ลบได้เฉพาะเอกสารที่ยังรอตรวจสอบหรือถูกปฏิเสธ" };

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
  revalidatePath("/admin/students");
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
  revalidatePath("/admin/students");
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
  revalidatePath("/admin/students");
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
  revalidatePath("/admin/students");
  return { success: true, count: pending.length };
}
