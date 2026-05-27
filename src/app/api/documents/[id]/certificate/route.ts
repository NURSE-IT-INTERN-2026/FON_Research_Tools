import { NextRequest, NextResponse } from "next/server";
import PDFDocument from "pdfkit";
import path from "path";
import { verifySessionToken, SESSION_COOKIE_NAME } from "@/lib/auth/session-token";
import db from "@/lib/db";

const FONT_REGULAR = path.join(process.cwd(), "src/fonts/Sarabun-Regular.ttf");
const FONT_BOLD = path.join(process.cwd(), "src/fonts/Sarabun-Bold.ttf");
const LOGO_PATH = path.join(process.cwd(), "public/nurseicon/nurse-en.png");

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
  const { id } = await params;

  const token = _request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = verifySessionToken(token);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const doc = await db.document.findUnique({ where: { id } });
  if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (doc.status !== "APPROVED") {
    return NextResponse.json({ error: "Document not approved" }, { status: 400 });
  }

  const userProfile = await db.profile.findUnique({ where: { id: session.userId }, select: { role: true } });
  const isAdmin = userProfile?.role === "ADMIN";
  const isOwner = doc.userId === session.userId;
  if (!isAdmin && !isOwner) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const profile = await db.profile.findUnique({
    where: { id: doc.userId },
    select: { name: true, studentId: true },
  });

  const approvedDocs = await db.document.findMany({
    where: { userId: doc.userId, status: "APPROVED" },
    orderBy: { reviewedAt: "asc" },
    select: { title: true, reviewedAt: true },
  });

  const latestApprovalDate = approvedDocs[approvedDocs.length - 1]?.reviewedAt ?? doc.reviewedAt!;

  const pdfDoc = new PDFDocument({ size: "A4", margin: 60 });
  pdfDoc.registerFont("Sarabun", FONT_REGULAR);
  pdfDoc.registerFont("SarabunBold", FONT_BOLD);

  const chunks: Buffer[] = [];
  pdfDoc.on("data", (chunk: Buffer) => chunks.push(chunk));

  // Logo
  pdfDoc.image(LOGO_PATH, (595.28 - 80) / 2, 40, { width: 80 });
  pdfDoc.y = 130;

  // Header
  pdfDoc.font("SarabunBold").fontSize(18).text("Research Tool", { align: "center" });
  pdfDoc.font("Sarabun").fontSize(12).text("Faculty of Nursing, Chiang Mai University", { align: "center" });
  pdfDoc.moveDown(0.5);

  // Divider
  pdfDoc.moveTo(60, pdfDoc.y).lineTo(535, pdfDoc.y).stroke();
  pdfDoc.moveDown(1.5);

  // Student info
  pdfDoc.font("SarabunBold").fontSize(13).text("ชื่อนักศึกษา", { continued: true });
  pdfDoc.font("Sarabun").text(`  ${profile?.name ?? "—"}`, { continued: true });
  pdfDoc.font("SarabunBold").text(`     รหัสนักศึกษา`, { continued: true });
  pdfDoc.font("Sarabun").text(`  ${profile?.studentId ?? "—"}`);
  pdfDoc.moveDown(1.5);

  // Tool list header
  pdfDoc.font("SarabunBold").fontSize(13).text("รายการเครื่องมือวิจัย");
  pdfDoc.moveDown(0.3);

  approvedDocs.forEach((d, i) => {
    pdfDoc.font("Sarabun").fontSize(12).text(`${i + 1}. ${d.title}`);
  });
  pdfDoc.moveDown(1.5);

  // Confirmation with date
  const dateStr = latestApprovalDate.toLocaleDateString("th-TH", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  pdfDoc.font("Sarabun").fontSize(12).text(
    `ได้บันทึกข้อมูลเครื่องมือวิจัยแล้วเมื่อวันที่ ${dateStr}`,
  );

  pdfDoc.end();

  const pdfBuffer = await new Promise<Buffer>((resolve) => {
    pdfDoc.on("end", () => resolve(Buffer.concat(chunks)));
  });

  // Filename: ชื่อเครื่องมือ_รหัสนศ.pdf
  const safeTitle = doc.title.replace(/[/\\?%*:|"<>]/g, "-").substring(0, 60);
  const studentId = profile?.studentId ?? id;
  const filename = `${safeTitle}_${studentId}.pdf`;

  return new NextResponse(new Uint8Array(pdfBuffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${encodeURIComponent(filename)}"`,
    },
  });
  } catch (err) {
    console.error("[certificate] Error:", err);
    return NextResponse.json({ error: "Internal server error", detail: String(err) }, { status: 500 });
  }
}
