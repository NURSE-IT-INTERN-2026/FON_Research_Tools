"use server";

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/auth";
import { logActivity } from "@/lib/activity-log";
import db from "@/lib/db";

export async function cancelBooking(bookingId: string) {
  const user = await requireAuth();

  const booking = await db.booking.findUnique({
    where: { id: bookingId },
    include: { tool: { select: { name: true } } },
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

  await logActivity({
    action: "BOOKING_CANCEL",
    userId: user.userId,
    targetType: "Booking",
    targetId: bookingId,
    targetLabel: booking.tool.name,
  });

  revalidatePath("/my-bookings");
  revalidatePath("/dashboard");
  return { success: true };
}
