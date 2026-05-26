import { NextRequest, NextResponse } from "next/server";
import { verifySessionToken, SESSION_COOKIE_NAME } from "@/lib/auth/session-token";
import db from "@/lib/db";

export async function GET(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = verifySessionToken(token);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const profile = await db.profile.findUnique({ where: { id: session.userId }, select: { role: true } });
  if (profile?.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const studentId = new URL(request.url).searchParams.get("studentId");
  if (!studentId) {
    return NextResponse.json({ error: "Missing studentId parameter" }, { status: 400 });
  }

  const studentProfile = await db.profile.findUnique({
    where: { studentId },
    select: { id: true },
  });
  if (!studentProfile) {
    return NextResponse.json({ error: "Student not found" }, { status: 404 });
  }

  const documents = await db.document.findMany({
    where: { userId: studentProfile.id },
    select: {
      id: true,
      title: true,
      status: true,
      createdAt: true,
      approvedAt: true,
      adminNotes: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({
    documents: documents.map((doc) => ({
      id: doc.id,
      title: doc.title,
      status: doc.status,
      createdAt: doc.createdAt.toISOString(),
      approvedAt: doc.approvedAt?.toISOString() ?? null,
      adminNotes: doc.adminNotes,
    })),
  });
}
