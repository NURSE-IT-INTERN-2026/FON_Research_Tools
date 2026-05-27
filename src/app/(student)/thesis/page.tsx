import { requireRole } from "@/lib/auth";
import db from "@/lib/db";
import { getThesisDataAndCache } from "@/lib/auth/cmu-oauth";
import { ThesisClient } from "@/components/student/thesis-client";

export default async function ThesisPage() {
  const { userId } = await requireRole("STUDENT");

  const [profile, thesis, documents] = await Promise.all([
    db.profile.findUnique({
      where: { id: userId },
      select: {
        name: true,
        email: true,
        studentId: true,
      },
    }),
    getThesisDataAndCache(userId),
    db.document.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        fileName: true,
        originalName: true,
        status: true,
        adminNotes: true,
        createdAt: true,
        reviewedAt: true,
        reviewedBy: true,
      },
    }),
  ]);

  const serialized = documents.map((d) => ({
    ...d,
    createdAt: d.createdAt.toISOString(),
    reviewedAt: d.reviewedAt?.toISOString() ?? null,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold tracking-tight heading-accent">
          วิทยานิพนธ์ของฉัน
        </h1>
        <p className="text-muted-foreground mt-3">
          ข้อมูลวิทยานิพนธ์และเอกสารเครื่องมือวิจัย
        </p>
      </div>

      {/* Section 1: Profile info */}
      <div className="rounded border bg-card p-5 space-y-3">
        <h2 className="font-heading font-bold tracking-tight text-sm uppercase text-muted-foreground">
          ข้อมูลส่วนตัว
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          <div>
            <span className="text-muted-foreground">ชื่อ-นามสกุล</span>
            <p className="font-medium">{profile?.name ?? "—"}</p>
          </div>
          <div>
            <span className="text-muted-foreground">รหัสนักศึกษา</span>
            <p className="font-medium">{profile?.studentId ?? "—"}</p>
          </div>
          <div>
            <span className="text-muted-foreground">อีเมล</span>
            <p className="font-medium">{profile?.email ?? "—"}</p>
          </div>
        </div>
      </div>

      {/* Section 2: Thesis info */}
      <div className="rounded border bg-card p-5 space-y-3">
        <h2 className="font-heading font-bold tracking-tight text-sm uppercase text-muted-foreground">
          ข้อมูลวิทยานิพนธ์
        </h2>
        {thesis ? (
          <div className="grid grid-cols-1 gap-3 text-sm">
            <div>
              <span className="text-muted-foreground">ชื่อวิทยานิพนธ์ (ไทย)</span>
              <p className="font-medium">{thesis.title_th}</p>
            </div>
            <div>
              <span className="text-muted-foreground">ชื่อวิทยานิพนธ์ (English)</span>
              <p className="font-medium">{thesis.title_en}</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <span className="text-muted-foreground">หลักสูตร</span>
                <p className="font-medium">{thesis.curriculum}</p>
              </div>
              <div>
                <span className="text-muted-foreground">สาขา</span>
                <p className="font-medium">{thesis.major_th}</p>
              </div>
              <div>
                <span className="text-muted-foreground">ระดับ</span>
                <p className="font-medium">{thesis.level_name_th}</p>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">ไม่พบข้อมูลวิทยานิพนธ์</p>
        )}
      </div>

      {/* Section 3 + 4: Upload + Document list (Client Component) */}
      <ThesisClient documents={serialized} />
    </div>
  );
}
