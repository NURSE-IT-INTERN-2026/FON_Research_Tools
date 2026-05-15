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
import { Wrench, PackageCheck, Clock, AlertTriangle } from "lucide-react";

export default async function AdminDashboardPage() {
  const [totalTools, borrowedTools, pendingRequests, overdueReturns, recentActivity] =
    await Promise.all([
      db.tool.count({ where: { isActive: true } }),
      db.tool.count({ where: { status: "BORROWED" } }),
      db.booking.count({ where: { status: "PENDING" } }),
      db.booking.count({ where: { status: "OVERDUE" } }),
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
        <p className="text-muted-foreground mt-3">ภาพรวมการจัดการอุปกรณ์</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4 stagger">
        <StatCard
          icon={Wrench}
          value={totalTools}
          label="อุปกรณ์ทั้งหมด"
          href="/admin/inventory"
        />
        <StatCard
          icon={PackageCheck}
          value={borrowedTools}
          label="กำลังยืม"
          href="/admin/inventory"
        />
        <StatCard
          icon={Clock}
          value={pendingRequests}
          label="รอตรวจสอบ"
          href="/admin/requests"
        />
        <StatCard
          icon={AlertTriangle}
          value={overdueReturns}
          label="เกินกำหนดคืน"
          href="/admin/requests"
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
