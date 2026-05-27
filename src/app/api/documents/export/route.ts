import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import db from "@/lib/db";
import * as XLSX from "xlsx";

const STATUS_LABEL: Record<string, string> = {
  PENDING: "รอตรวจสอบ",
  APPROVED: "อนุมัติแล้ว",
  REJECTED: "ปฏิเสธแล้ว",
};

export async function GET(request: NextRequest) {
  await requireRole("ADMIN");

  const { searchParams } = request.nextUrl;
  const statusFilter = searchParams.get("status");
  const q = searchParams.get("q")?.trim();
  const format = searchParams.get("format") === "csv" ? "csv" : "xlsx";

  const where = {
    AND: [
      statusFilter ? { status: statusFilter as "PENDING" | "APPROVED" | "REJECTED" } : {},
      q ? {
        OR: [
          { title: { contains: q, mode: "insensitive" as const } },
          { profile: { name: { contains: q, mode: "insensitive" as const } } },
          { profile: { studentId: { contains: q, mode: "insensitive" as const } } },
        ],
      } : {},
    ],
  };

  const rows = await db.document.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      profile: {
        select: { name: true, studentId: true },
      },
    },
  });

  const data = rows.map((doc, i) => ({
    "ลำดับ": i + 1,
    "ชื่อนักศึกษา": doc.profile.name,
    "รหัสนักศึกษา": doc.profile.studentId ?? "",
    "ชื่อเครื่องมือวิจัย": doc.title,
    "สถานะ": STATUS_LABEL[doc.status] ?? doc.status,
    "วันที่อัปโหลด": doc.createdAt.toLocaleDateString("th-TH"),
    "วันที่ดำเนินการ": doc.reviewedAt?.toLocaleDateString("th-TH") ?? "",
    "ผู้ดำเนินการ": doc.reviewedBy ?? "",
    "หมายเหตุ": doc.adminNotes ?? "",
  }));

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(data);
  ws["!cols"] = [
    { wch: 6 },   // ลำดับ
    { wch: 25 },  // ชื่อนักศึกษา
    { wch: 15 },  // รหัสนักศึกษา
    { wch: 35 },  // ชื่อเครื่องมือวิจัย
    { wch: 14 },  // สถานะ
    { wch: 16 },  // วันที่อัปโหลด
    { wch: 16 },  // วันที่ดำเนินการ
    { wch: 20 },  // ผู้ดำเนินการ
    { wch: 30 },  // หมายเหตุ
  ];
  XLSX.utils.book_append_sheet(wb, ws, "เอกสาร");

  const suffix = statusFilter ? `_${STATUS_LABEL[statusFilter] ?? statusFilter}` : "_ทั้งหมด";

  if (format === "csv") {
    const csv = XLSX.utils.sheet_to_csv(ws);
    const buf = new TextEncoder().encode("﻿" + csv);
    return new NextResponse(buf, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(`เอกสาร${suffix}.csv`)}`,
      },
    });
  }

  const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
  return new NextResponse(buf, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(`เอกสาร${suffix}.xlsx`)}`,
    },
  });
}
