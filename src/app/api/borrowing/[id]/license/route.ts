import { NextRequest, NextResponse } from "next/server";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { verifySessionToken, SESSION_COOKIE_NAME } from "@/lib/auth/session-token";
import db from "@/lib/db";

const UPLOAD_DIR = join(process.cwd(), "uploads", "borrowing");

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const type = request.nextUrl.searchParams.get("type") || "license";

  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = verifySessionToken(token);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const record = await db.borrowingRecord.findUnique({ where: { id } });
  if (!record) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const userProfile = await db.profile.findUnique({
    where: { id: session.userId },
    select: { role: true },
  });
  if (userProfile?.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const isLicense = type === "license";
  const fileName = isLicense ? record.licenseFileName : record.certificateFileName;
  const originalName = isLicense ? record.licenseOriginalName : record.certificateOriginalName;

  if (!fileName) return NextResponse.json({ error: "No file" }, { status: 404 });

  const filePath = join(UPLOAD_DIR, fileName);

  try {
    const fileBuffer = await readFile(filePath);
    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${encodeURIComponent(originalName ?? `${type}.pdf`)}"`,
      },
    });
  } catch {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }
}
