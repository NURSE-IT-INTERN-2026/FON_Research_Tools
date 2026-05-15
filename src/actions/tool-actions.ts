"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
import db from "@/lib/db";

export type ActionState = { success?: boolean; error?: string };

export async function saveTool(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireRole("ADMIN");

  const id = formData.get("id") as string;
  const name = (formData.get("name") as string)?.trim();
  const description = (formData.get("description") as string)?.trim() ?? "";
  const category = (formData.get("category") as string)?.trim() || "General";
  const serialNumber = (formData.get("serialNumber") as string)?.trim();
  const imageUrl = (formData.get("imageUrl") as string)?.trim() || null;
  const location = (formData.get("location") as string)?.trim() ?? "";
  const status = formData.get("status") as string;

  if (!name) return { error: "กรุณากรอกชื่ออุปกรณ์" };
  if (!serialNumber) return { error: "กรุณากรอกหมายเลขซีเรียล" };

  if (id) {
    const tool = await db.tool.findUnique({ where: { id } });
    if (!tool) return { error: "ไม่พบอุปกรณ์" };

    if (serialNumber !== tool.serialNumber) {
      const dup = await db.tool.findUnique({ where: { serialNumber } });
      if (dup) return { error: "หมายเลขซีเรียลนี้มีอยู่ในระบบแล้ว" };
    }

    await db.tool.update({
      where: { id },
      data: { name, description, category, serialNumber, imageUrl, location },
    });
  } else {
    const dup = await db.tool.findUnique({ where: { serialNumber } });
    if (dup) return { error: "หมายเลขซีเรียลนี้มีอยู่ในระบบแล้ว" };

    await db.tool.create({
      data: {
        name,
        description,
        category,
        serialNumber,
        imageUrl,
        location,
        status: status === "MAINTENANCE" ? "MAINTENANCE" : "AVAILABLE",
      },
    });
  }

  revalidatePath("/admin/inventory");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function toggleToolStatus(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireRole("ADMIN");

  const toolId = formData.get("toolId") as string;
  const tool = await db.tool.findUnique({ where: { id: toolId } });
  if (!tool) return { error: "ไม่พบอุปกรณ์" };
  if (tool.status === "BORROWED") {
    return { error: "ไม่สามารถเปลี่ยนสถานะอุปกรณ์ที่กำลังยืมอยู่" };
  }

  const newStatus = tool.status === "AVAILABLE" ? "MAINTENANCE" : "AVAILABLE";
  await db.tool.update({ where: { id: toolId }, data: { status: newStatus } });

  revalidatePath("/admin/inventory");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function deactivateTool(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireRole("ADMIN");

  const toolId = formData.get("toolId") as string;
  const tool = await db.tool.findUnique({
    where: { id: toolId },
    include: { _count: { select: { bookings: true } } },
  });
  if (!tool) return { error: "ไม่พบอุปกรณ์" };
  if (tool.status === "BORROWED") {
    return { error: "ไม่สามารถปิดใช้งานอุปกรณ์ที่กำลังยืมอยู่" };
  }

  if (tool._count.bookings === 0) {
    await db.tool.delete({ where: { id: toolId } });
  } else {
    await db.tool.update({
      where: { id: toolId },
      data: { isActive: false },
    });
  }

  revalidatePath("/admin/inventory");
  revalidatePath("/dashboard");
  return { success: true };
}
