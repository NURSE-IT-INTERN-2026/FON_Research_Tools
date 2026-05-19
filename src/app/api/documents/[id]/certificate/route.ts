import { NextRequest, NextResponse } from "next/server";
import PDFDocument from "pdfkit";
import { verifySessionToken, SESSION_COOKIE_NAME } from "@/lib/auth/session-token";
import db from "@/lib/db";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const token = _request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = verifySessionToken(token);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const doc = await db.document.findUnique({ where: { id } });
  if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (doc.status !== "APPROVED") {
    return NextResponse.json({ error: "Document not approved" }, { status: 400 });
  }

  const userRole = await db.userRole.findUnique({ where: { userId: session.userId } });
  const isAdmin = userRole?.role === "ADMIN";
  const isOwner = doc.userId === session.userId;
  if (!isAdmin && !isOwner) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const profile = await db.profile.findUnique({
    where: { id: doc.userId },
    select: { name: true, studentId: true },
  });

  // Get all approved documents for this student
  const approvedDocs = await db.document.findMany({
    where: { userId: doc.userId, status: "APPROVED" },
    orderBy: { approvedAt: "asc" },
    select: { title: true, approvedAt: true },
  });

  const latestApprovalDate = approvedDocs[approvedDocs.length - 1]?.approvedAt ?? doc.approvedAt!;

  // Generate PDF
  const pdfDoc = new PDFDocument({ size: "A4", margin: 60 });
  const chunks: Buffer[] = [];
  pdfDoc.on("data", (chunk: Buffer) => chunks.push(chunk));

  const fontRegular = "Helvetica";
  const fontBold = "Helvetica-Bold";

  // Header
  pdfDoc.font(fontBold).fontSize(18).text("Research Tool", { align: "center" });
  pdfDoc.font(fontRegular).fontSize(12).text("Faculty of Nursing, Chiang Mai University", { align: "center" });
  pdfDoc.moveDown(0.5);

  // Divider
  pdfDoc.moveTo(60, pdfDoc.y).lineTo(535, pdfDoc.y).stroke();
  pdfDoc.moveDown(1);

  // Title
  pdfDoc.font(fontBold).fontSize(14).text("Certificate of Research Tool Submission", { align: "center" });
  pdfDoc.moveDown(1.5);

  // Student info
  pdfDoc.font(fontBold).fontSize(11).text("Student Information", { underline: true });
  pdfDoc.moveDown(0.5);
  pdfDoc.font(fontRegular).fontSize(11);
  pdfDoc.text(`Name: ${profile?.name ?? "—"}`);
  pdfDoc.text(`Student ID: ${profile?.studentId ?? "—"}`);
  pdfDoc.moveDown(1);

  // Tool list
  pdfDoc.font(fontBold).fontSize(11).text("Research Instruments", { underline: true });
  pdfDoc.moveDown(0.5);
  approvedDocs.forEach((d, i) => {
    pdfDoc.font(fontRegular).fontSize(11).text(`${i + 1}. ${d.title}`);
  });
  pdfDoc.moveDown(1.5);

  // Confirmation
  const dateStr = latestApprovalDate.toLocaleDateString("th-TH", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  pdfDoc.font(fontRegular).fontSize(11).text(
    `This is to certify that the above research instruments have been recorded\non ${dateStr}.`,
  );
  pdfDoc.moveDown(3);

  // Signature area
  pdfDoc.font(fontRegular).fontSize(10).text("Authorized by", { align: "center" });
  pdfDoc.moveDown(2);
  pdfDoc.moveTo(180, pdfDoc.y).lineTo(420, pdfDoc.y).stroke();
  pdfDoc.moveDown(0.3);
  pdfDoc.font(fontBold).fontSize(10).text("Faculty of Nursing", { align: "center" });
  pdfDoc.text("Chiang Mai University", { align: "center" });

  pdfDoc.end();

  const pdfBuffer = await new Promise<Buffer>((resolve) => {
    pdfDoc.on("end", () => resolve(Buffer.concat(chunks)));
  });

  return new NextResponse(new Uint8Array(pdfBuffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="certificate_${profile?.studentId ?? id}.pdf"`,
    },
  });
}
