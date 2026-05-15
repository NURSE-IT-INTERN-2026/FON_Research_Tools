"use server";

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/auth";
import db from "@/lib/db";

export type CreateBookingState = {
  success?: boolean;
  error?: string;
};

export async function createBooking(
  _prev: CreateBookingState,
  formData: FormData,
): Promise<CreateBookingState> {
  const user = await requireAuth();
  const toolId = formData.get("toolId") as string;
  const startDateStr = formData.get("startDate") as string;
  const endDateStr = formData.get("endDate") as string;
  const purpose = String(formData.get("purpose") ?? "").trim();

  if (!toolId || !startDateStr || !endDateStr || !purpose) {
    return { error: "กรุณากรอกข้อมูลให้ครบถ้วน" };
  }

  const startDate = new Date(startDateStr);
  const endDate = new Date(endDateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (startDate < today) {
    return { error: "วันที่เริ่มต้นต้องไม่เป็นวันในอดีต" };
  }

  if (endDate < startDate) {
    return { error: "วันที่สิ้นสุดต้องไม่น้อยกว่าวันที่เริ่มต้น" };
  }

  const tool = await db.tool.findUnique({ where: { id: toolId } });
  if (!tool || !tool.isActive || tool.status !== "AVAILABLE") {
    return { error: "อุปกรณ์นี้ไม่พร้อมให้ยืมในขณะนี้" };
  }

  await db.booking.create({
    data: {
      userId: user.userId,
      toolId,
      startDate,
      endDate,
      purpose,
      status: "PENDING",
    },
  });

  revalidatePath("/dashboard");
  return { success: true };
}
