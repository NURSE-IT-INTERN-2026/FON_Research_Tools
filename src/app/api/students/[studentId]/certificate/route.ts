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
  { params }: { params: Promise<{ studentId: string }> },
) {
  try {
    const { studentId } = await params;

    const token = _request.cookies.get(SESSION_COOKIE_NAME)?.value;
    const session = verifySessionToken(token);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const profile = await db.profile.findUnique({
      where: { studentId },
      select: { id: true, name: true, studentId: true, role: true },
    });
    if (!profile) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    const requester = await db.profile.findUnique({
      where: { id: session.userId },
      select: { role: true, studentId: true },
    });
    const isAdmin = requester?.role === "ADMIN";
    const isOwner = requester?.studentId === studentId;
    if (!isAdmin && !isOwner) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const approvedDocs = await db.document.findMany({
      where: { userId: profile.id, status: "APPROVED" },
      orderBy: { reviewedAt: "asc" },
      select: { title: true, reviewedAt: true },
    });

    if (approvedDocs.length === 0) {
      return NextResponse.json(
        { error: "No approved documents" },
        { status: 404 },
      );
    }

    const pdfDoc = new PDFDocument({ size: "A4", margin: 60 });
    pdfDoc.registerFont("Sarabun", FONT_REGULAR);
    pdfDoc.registerFont("SarabunBold", FONT_BOLD);

    const chunks: Buffer[] = [];
    pdfDoc.on("data", (chunk: Buffer) => chunks.push(chunk));

    pdfDoc.image(LOGO_PATH, (595.28 - 80) / 2, 40, { width: 80 });
    pdfDoc.y = 130;

    pdfDoc.font("SarabunBold").fontSize(18).text("Research Tool", { align: "center" });
    pdfDoc.font("Sarabun").fontSize(12).text("Faculty of Nursing, Chiang Mai University", { align: "center" });
    pdfDoc.moveDown(0.5);

    pdfDoc.moveTo(60, pdfDoc.y).lineTo(535, pdfDoc.y).stroke();
    pdfDoc.moveDown(1.5);

    pdfDoc.font("SarabunBold").fontSize(13).text("ชื่อนักศึกษา", { continued: true });
    pdfDoc.font("Sarabun").text(`  ${profile.name ?? "—"}`, { continued: true });
    pdfDoc.font("SarabunBold").text(`     รหัสนักศึกษา`, { continued: true });
    pdfDoc.font("Sarabun").text(`  ${profile.studentId ?? "—"}`);
    pdfDoc.moveDown(1.5);

    pdfDoc.font("SarabunBold").fontSize(13).text("รายการเครื่องมือวิจัย");
    pdfDoc.moveDown(0.3);

    approvedDocs.forEach((d, i) => {
      const approvedDateStr = (d.reviewedAt ?? new Date()).toLocaleDateString("th-TH", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
      pdfDoc.font("Sarabun").fontSize(12).text(`${i + 1}. ${d.title}`);
      pdfDoc.font("Sarabun").fontSize(11).fillColor("#555").text(`   อนุมัติเมื่อ ${approvedDateStr}`);
      pdfDoc.fillColor("#000");
    });
    pdfDoc.moveDown(1.5);

    pdfDoc.end();

    const pdfBuffer = await new Promise<Buffer>((resolve) => {
      pdfDoc.on("end", () => resolve(Buffer.concat(chunks)));
    });

    const filename = `certificate_${profile.studentId ?? studentId}.pdf`;

    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${encodeURIComponent(filename)}"`,
      },
    });
  } catch (err) {
    console.error("[student certificate] Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
