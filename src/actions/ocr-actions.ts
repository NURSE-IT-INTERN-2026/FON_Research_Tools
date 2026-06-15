"use server";

import { requireRole } from "@/lib/auth";
import { extractLicenseData, type OCRResult } from "@/lib/ocr";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

export type OCRActionState = {
  success?: boolean;
  error?: string;
  data?: OCRResult;
};

export async function processOCR(
  formData: FormData,
): Promise<OCRActionState> {
  await requireRole("ADMIN");

  const file = formData.get("licenseFile");

  if (!file || !(file instanceof File) || file.size === 0) {
    return { error: "กรุณาเลือกไฟล์ PDF ก่อนกดอ่านเอกสาร" };
  }
  if (file.type !== "application/pdf") {
    return { error: "รองรับเฉพาะไฟล์ PDF เท่านั้น" };
  }
  if (file.size > MAX_FILE_SIZE) {
    return { error: "ไฟล์มีขนาดเกิน 10 MB" };
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const data = await extractLicenseData(buffer);
    return { success: true, data };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "เกิดข้อผิดพลาดในการอ่านเอกสาร";
    return { error: message };
  }
}
