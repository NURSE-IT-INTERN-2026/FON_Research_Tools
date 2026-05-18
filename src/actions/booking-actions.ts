"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
import { logActivity } from "@/lib/activity-log";
import db from "@/lib/db";

export type ActionState = { success?: boolean; error?: string };

export async function approveBooking(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const ctx = await requireRole("ADMIN");

  const bookingId = formData.get("bookingId") as string;
  const adminNotes = (formData.get("adminNotes") as string)?.trim() || null;

  const booking = await db.booking.findUnique({
    where: { id: bookingId },
    include: { profile: { select: { name: true } }, tool: { select: { name: true } } },
  });
  if (!booking) return { error: "ไม่พบคำขอยืม" };
  if (booking.status !== "PENDING") {
    return { error: "สามารถอนุมัติได้เฉพาะคำขอที่รอตรวจสอบเท่านั้น" };
  }

  const tool = await db.tool.findUnique({ where: { id: booking.toolId } });
  if (!tool || !tool.isActive || tool.status !== "AVAILABLE") {
    return { error: "อุปกรณ์นี้ไม่พร้อมให้ยืมในขณะนี้" };
  }

  await db.$transaction([
    db.booking.update({
      where: { id: bookingId },
      data: { status: "APPROVED", adminNotes },
    }),
    db.tool.update({
      where: { id: booking.toolId },
      data: { status: "BORROWED" },
    }),
  ]);

  await logActivity({
    action: "BOOKING_APPROVE",
    userId: ctx.userId,
    targetType: "Booking",
    targetId: bookingId,
    targetLabel: `${booking.profile.name} → ${booking.tool.name}`,
    metadata: adminNotes ? { adminNotes } : null,
  });

  revalidatePath("/admin/requests");
  revalidatePath("/admin/dashboard");
  revalidatePath("/my-bookings");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function rejectBooking(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const ctx = await requireRole("ADMIN");

  const bookingId = formData.get("bookingId") as string;
  const adminNotes = (formData.get("adminNotes") as string)?.trim() || null;

  const booking = await db.booking.findUnique({
    where: { id: bookingId },
    include: { profile: { select: { name: true } }, tool: { select: { name: true } } },
  });
  if (!booking) return { error: "ไม่พบคำขอยืม" };
  if (booking.status !== "PENDING") {
    return { error: "สามารถปฏิเสธได้เฉพาะคำขอที่รอตรวจสอบเท่านั้น" };
  }

  await db.booking.update({
    where: { id: bookingId },
    data: { status: "REJECTED", adminNotes },
  });

  await logActivity({
    action: "BOOKING_REJECT",
    userId: ctx.userId,
    targetType: "Booking",
    targetId: bookingId,
    targetLabel: `${booking.profile.name} → ${booking.tool.name}`,
    metadata: adminNotes ? { adminNotes } : null,
  });

  revalidatePath("/admin/requests");
  revalidatePath("/admin/dashboard");
  revalidatePath("/my-bookings");
  return { success: true };
}

export async function markReturned(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const ctx = await requireRole("ADMIN");

  const bookingId = formData.get("bookingId") as string;

  const booking = await db.booking.findUnique({
    where: { id: bookingId },
    include: { profile: { select: { name: true } }, tool: { select: { name: true } } },
  });
  if (!booking) return { error: "ไม่พบคำขอยืม" };
  if (booking.status !== "APPROVED" && booking.status !== "OVERDUE") {
    return { error: "สามารถคืนได้เฉพาะรายการที่อนุมัติแล้วหรือเกินกำหนดเท่านั้น" };
  }

  const otherApproved = await db.booking.count({
    where: {
      toolId: booking.toolId,
      status: "APPROVED",
      id: { not: bookingId },
    },
  });

  await db.$transaction([
    db.booking.update({
      where: { id: bookingId },
      data: { status: "RETURNED", returnDate: new Date() },
    }),
    ...(otherApproved === 0
      ? [db.tool.update({ where: { id: booking.toolId }, data: { status: "AVAILABLE" } })]
      : []),
  ]);

  await logActivity({
    action: "BOOKING_RETURN",
    userId: ctx.userId,
    targetType: "Booking",
    targetId: bookingId,
    targetLabel: `${booking.profile.name} → ${booking.tool.name}`,
  });

  revalidatePath("/admin/requests");
  revalidatePath("/admin/dashboard");
  revalidatePath("/admin/inventory");
  revalidatePath("/my-bookings");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function markOverdue(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const ctx = await requireRole("ADMIN");

  const bookingId = formData.get("bookingId") as string;

  const booking = await db.booking.findUnique({
    where: { id: bookingId },
    include: { profile: { select: { name: true } }, tool: { select: { name: true } } },
  });
  if (!booking) return { error: "ไม่พบคำขอยืม" };
  if (booking.status !== "APPROVED") {
    return { error: "สามารถตั้งค่าเกินกำหนดได้เฉพาะรายการที่อนุมัติแล้วเท่านั้น" };
  }

  await db.booking.update({
    where: { id: bookingId },
    data: { status: "OVERDUE" },
  });

  await logActivity({
    action: "BOOKING_OVERDUE",
    userId: ctx.userId,
    targetType: "Booking",
    targetId: bookingId,
    targetLabel: `${booking.profile.name} → ${booking.tool.name}`,
  });

  revalidatePath("/admin/requests");
  revalidatePath("/admin/dashboard");
  revalidatePath("/my-bookings");
  return { success: true };
}
