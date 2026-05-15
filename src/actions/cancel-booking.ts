"use server";

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/auth";
import db from "@/lib/db";

export async function cancelBooking(bookingId: string) {
  const user = await requireAuth();

  const booking = await db.booking.findUnique({
    where: { id: bookingId },
  });

  if (!booking || booking.userId !== user.userId) {
    return { error: "ไม่พบคำขอยืม" };
  }

  if (booking.status !== "PENDING") {
    return { error: "ไม่สามารถยกเลิกคำขอที่ไม่ใช่สถานะรอตรวจสอบ" };
  }

  await db.booking.update({
    where: { id: bookingId },
    data: { status: "REJECTED" },
  });

  revalidatePath("/my-bookings");
  return { success: true };
}
