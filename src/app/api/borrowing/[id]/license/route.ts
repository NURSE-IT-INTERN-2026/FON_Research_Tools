import { NextRequest, NextResponse } from "next/server";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { verifySessionToken, SESSION_COOKIE_NAME } from "@/lib/auth/session-token";
import db from "@/lib/db";

const UPLOAD_DIR = join(process.cwd(), "uploads", "borrowing");

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const token = _request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = verifySessionToken(token);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const record = await db.borrowingRecord.findUnique({ where: { id } });
  if (!record) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!record.licenseFileName) return NextResponse.json({ error: "No license file" }, { status: 404 });

  const userProfile = await db.profile.findUnique({
    where: { id: session.userId },
    select: { role: true },
  });
  const isAdmin = userProfile?.role === "ADMIN";
  const isOwner = record.userId === session.userId;
  if (!isAdmin && !isOwner) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const filePath = join(UPLOAD_DIR, record.licenseFileName);

  try {
    const fileBuffer = await readFile(filePath);
    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${encodeURIComponent(record.licenseOriginalName ?? "license.pdf")}"`,
      },
    });
  } catch {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }
}
