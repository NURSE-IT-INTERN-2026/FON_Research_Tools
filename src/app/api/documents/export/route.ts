import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import db from "@/lib/db";
import ExcelJS from "exceljs";

const STATUS_LABEL: Record<string, string> = {
  PENDING: "รอตรวจสอบ",
  APPROVED: "อนุมัติแล้ว",
  REJECTED: "ปฏิเสธแล้ว",
};

const COLUMNS: Partial<ExcelJS.Column>[] = [
  { header: "ลำดับ", key: "index", width: 6 },
  { header: "ชื่อนักศึกษา", key: "name", width: 25 },
  { header: "รหัสนักศึกษา", key: "studentId", width: 15 },
  { header: "ชื่อเครื่องมือวิจัย", key: "title", width: 35 },
  { header: "สถานะ", key: "status", width: 14 },
  { header: "วันที่อัปโหลด", key: "uploadedAt", width: 16 },
  { header: "วันที่ดำเนินการ", key: "reviewedAt", width: 16 },
  { header: "ผู้ดำเนินการ", key: "reviewedBy", width: 20 },
  { header: "หมายเหตุ", key: "notes", width: 30 },
];

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
    index: i + 1,
    name: doc.profile.name,
    studentId: doc.profile.studentId ?? "",
    title: doc.title,
    status: STATUS_LABEL[doc.status] ?? doc.status,
    uploadedAt: doc.createdAt.toLocaleDateString("th-TH"),
    reviewedAt: doc.reviewedAt?.toLocaleDateString("th-TH") ?? "",
    reviewedBy: doc.reviewedBy ?? "",
    notes: doc.adminNotes ?? "",
  }));

  const suffix = statusFilter ? `_${STATUS_LABEL[statusFilter] ?? statusFilter}` : "_ทั้งหมด";

  if (format === "csv") {
    const headers = COLUMNS.map(c => c.header as string);
    const csvRows = [headers.join(",")];
    for (const row of data) {
      csvRows.push(
        Object.values(row).map(v => `"${String(v).replace(/"/g, '""')}"`).join(",")
      );
    }
    const buf = new TextEncoder().encode("﻿" + csvRows.join("\r\n"));
    return new NextResponse(buf, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(`เอกสาร${suffix}.csv`)}`,
      },
    });
  }

  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("เอกสาร");
  ws.columns = COLUMNS;
  for (const row of data) {
    ws.addRow(row);
  }

  const buf = await wb.xlsx.writeBuffer();
  return new NextResponse(buf, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(`เอกสาร${suffix}.xlsx`)}`,
    },
  });
}
