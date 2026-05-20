import db from "@/lib/db";
import { timeAgo } from "@/lib/utils";
import { ACTION_LABELS } from "@/lib/activity-meta";
import { StatCard } from "@/components/stat-card";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { Users, FileText, Clock, CheckCircle } from "lucide-react";

export default async function AdminDashboardPage() {
  const [totalStudents, totalDocuments, pendingDocuments, approvedDocuments, recentActivity] =
    await Promise.all([
      db.profile.count({ where: { userRole: { role: "STUDENT" } } }),
      db.document.count(),
      db.document.count({ where: { status: "PENDING" } }),
      db.document.count({ where: { status: "APPROVED" } }),
      db.activityLog.findMany({
        take: 10,
        orderBy: { createdAt: "desc" },
        include: {
          profile: { select: { name: true } },
        },
      }),
    ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold tracking-tight heading-accent">แดชบอร์ด</h1>
        <p className="text-muted-foreground mt-3">ภาพรวมระบบจัดการเอกสารเครื่องมือวิจัย</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4 stagger">
        <StatCard
          icon={Users}
          value={totalStudents}
          label="นักศึกษาทั้งหมด"
          href="/admin/users"
        />
        <StatCard
          icon={FileText}
          value={totalDocuments}
          label="เอกสารทั้งหมด"
          href="/admin/documents"
        />
        <StatCard
          icon={Clock}
          value={pendingDocuments}
          label="รอตรวจสอบ"
          href="/admin/documents?status=PENDING"
        />
        <StatCard
          icon={CheckCircle}
          value={approvedDocuments}
          label="อนุมัติแล้ว"
          href="/admin/documents?status=APPROVED"
        />
      </div>

      <Card className="rounded border">
        <CardHeader>
          <CardTitle className="font-heading font-bold tracking-tight">กิจกรรมล่าสุด</CardTitle>
        </CardHeader>
        <CardContent>
          {recentActivity.length === 0 ? (
            <p className="py-4 text-center text-muted-foreground">
              ยังไม่มีกิจกรรม
            </p>
          ) : (
            <div className="divide-y">
              {recentActivity.map((log) => (
                <div
                  key={log.id}
                  className="flex items-center justify-between py-3 first:pt-0 last:pb-0"
                >
                  <p className="text-sm">
                    <span className="font-semibold">
                      {log.profile.name}
                    </span>{" "}
                    <span className="text-muted-foreground">
                      {ACTION_LABELS[log.action] ?? log.action}
                    </span>
                    {log.targetLabel && (
                      <>
                        {" "}
                        <span className="font-semibold">{log.targetLabel}</span>
                      </>
                    )}
                  </p>
                  <span className="shrink-0 text-xs text-muted-foreground font-mono">
                    {timeAgo(log.createdAt)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
