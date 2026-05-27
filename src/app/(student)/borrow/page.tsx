import { requireRole } from "@/lib/auth";
import db from "@/lib/db";
import { BorrowClient } from "@/components/student/borrow-client";

export default async function BorrowPage() {
  const { userId } = await requireRole("STUDENT");

  const [instruments, records] = await Promise.all([
    db.instrument.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    db.borrowingRecord.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        requesterName: true,
        requestDate: true,
        additionalDetails: true,
        status: true,
        adminNotes: true,
        createdAt: true,
        reviewedAt: true,
        licenseOriginalName: true,
        instrument: { select: { name: true } },
      },
    }),
  ]);

  const serialized = records.map((r) => ({
    ...r,
    requestDate: r.requestDate?.toISOString() ?? null,
    createdAt: r.createdAt.toISOString(),
    reviewedAt: r.reviewedAt?.toISOString() ?? null,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold tracking-tight heading-accent">
          ยืมเครื่องมือวิจัย
        </h1>
        <p className="text-muted-foreground mt-3">
          เลือกเครื่องมือวิจัยและอัปโหลดใบอนุญาตเพื่อขอยืม
        </p>
      </div>

      <BorrowClient instruments={instruments} records={serialized} />
    </div>
  );
}
