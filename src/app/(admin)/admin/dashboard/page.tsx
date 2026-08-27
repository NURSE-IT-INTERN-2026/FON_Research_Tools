import { cache } from "react";
import db from "@/lib/db";
import { timeAgo } from "@/lib/utils";
import { ACTION_LABELS } from "@/lib/activity-meta";
import { StatCard } from "@/components/stat-card";
import { WidgetCard, EmptyHint } from "@/components/dashboard-widget-card";
import {
  Users,
  FileText,
  Clock,
  CheckCircle,
  Package,
  Shield,
  Activity,
} from "lucide-react";

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

const getWeekAgo = cache((): Date => new Date(Date.now() - WEEK_MS));

export default async function AdminDashboardPage() {
  const weekAgo = getWeekAgo();

  const [
    totalStudents,
    newStudentsWeek,
    topStudents,
    totalDocuments,
    pendingDocuments,
    approvedDocuments,
    recentPending,
    weekBorrowCount,
    recentBorrowing,
    adminCount,
    topAdmins,
    activeAdminIdsWeek,
    recentActivity,
  ] = await Promise.all([
    db.profile.count({ where: { role: "STUDENT" } }),
    db.profile.count({ where: { role: "STUDENT", createdAt: { gte: weekAgo } } }),
    db.profile.findMany({
      where: { role: "STUDENT" },
      orderBy: { documents: { _count: "desc" } },
      take: 2,
      select: { id: true, name: true, _count: { select: { documents: true } } },
    }),
    db.document.count(),
    db.document.count({ where: { status: "PENDING" } }),
    db.document.count({ where: { status: "APPROVED" } }),
    db.document.findMany({
      where: { status: "PENDING" },
      orderBy: { createdAt: "desc" },
      take: 3,
      include: { profile: { select: { name: true } } },
    }),
    db.borrowingRecord.count({ where: { createdAt: { gte: weekAgo } } }),
    db.borrowingRecord.findMany({
      orderBy: { createdAt: "desc" },
      take: 3,
      include: { owner: { select: { name: true } } },
    }),
    db.profile.count({ where: { role: "ADMIN" } }),
    db.profile.findMany({
      where: { role: "ADMIN" },
      orderBy: { activityLogs: { _count: "desc" } },
      take: 3,
      select: { id: true, name: true, _count: { select: { activityLogs: true } } },
    }),
    db.activityLog.findMany({
      where: { createdAt: { gte: weekAgo }, profile: { role: "ADMIN" } },
      distinct: ["userId"],
      select: { userId: true },
    }),
    db.activityLog.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: { profile: { select: { name: true } } },
    }),
  ]);

  const activeAdminsWeek = activeAdminIdsWeek.length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold tracking-tight heading-accent">แดชบอร์ด</h1>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4 stagger">
        <StatCard
          icon={Users}
          value={totalStudents}
          label="นักศึกษาทั้งหมด"
          href="/admin/students"
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

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 stagger">
        <WidgetCard
          href="/admin/documents?status=PENDING"
          icon={FileText}
          title="เอกสารเครื่องมือวิจัย"
        >
          <p className="mb-3 text-sm text-muted-foreground">
            รอตรวจ <span className="font-semibold text-foreground">{pendingDocuments}</span> ไฟล์
          </p>
          {recentPending.length === 0 ? (
            <EmptyHint>ยังไม่มีเอกสารรอตรวจ</EmptyHint>
          ) : (
            <ul className="divide-y">
              {recentPending.map((doc) => (
                <li
                  key={doc.id}
                  className="flex items-center justify-between gap-2 py-2 first:pt-0 last:pb-0"
                >
                  <p className="min-w-0 text-sm">
                    <span className="font-semibold">{doc.profile.name}</span>
                    <span className="text-muted-foreground"> · {doc.title}</span>
                  </p>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {timeAgo(doc.createdAt)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </WidgetCard>

        <WidgetCard href="/admin/borrowing" icon={Package} title="บันทึกการขออนุญาตใช้">
          <p className="mb-3 text-sm text-muted-foreground">
            สัปดาห์นี้ +<span className="font-semibold text-foreground">{weekBorrowCount}</span> รายการ
          </p>
          {recentBorrowing.length === 0 ? (
            <EmptyHint>ยังไม่มีรายการขออนุญาตใช้</EmptyHint>
          ) : (
            <ul className="divide-y">
              {recentBorrowing.map((rec) => (
                <li
                  key={rec.id}
                  className="flex items-center justify-between gap-2 py-2 first:pt-0 last:pb-0"
                >
                  <p className="min-w-0 text-sm">
                    <span className="font-semibold">{rec.requesterName}</span>
                    <span className="text-muted-foreground"> → {rec.owner.name}</span>
                  </p>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {timeAgo(rec.createdAt)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </WidgetCard>

        <WidgetCard href="/admin/students" icon={Users} title="รายชื่อนักศึกษา">
          <p className="mb-3 text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">{totalStudents}</span> คน
            {" · "}ใหม่สัปดาห์นี้ <span className="font-semibold text-foreground">{newStudentsWeek}</span> คน
          </p>
          <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            เอกสารมากสุด
          </p>
          {topStudents.length === 0 ? (
            <EmptyHint>ยังไม่มีนักศึกษา</EmptyHint>
          ) : (
            <ul className="divide-y">
              {topStudents.map((student, idx) => (
                <li
                  key={student.id}
                  className="flex items-center justify-between gap-2 py-2 first:pt-0 last:pb-0"
                >
                  <p className="min-w-0 text-sm">
                    <span className="text-muted-foreground">{idx + 1}.</span>{" "}
                    <span className="font-semibold">{student.name}</span>
                  </p>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {student._count.documents} ไฟล์
                  </span>
                </li>
              ))}
            </ul>
          )}
        </WidgetCard>

        <WidgetCard href="/admin/admins" icon={Shield} title="จัดการผู้ดูแล">
          <p className="mb-3 text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">{adminCount}</span> คน
            {" · "}ใช้งานสัปดาห์นี้ <span className="font-semibold text-foreground">{activeAdminsWeek}</span> คน
          </p>
          <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            กิจกรรมมากสุด
          </p>
          {topAdmins.length === 0 ? (
            <EmptyHint>ยังไม่มีผู้ดูแล</EmptyHint>
          ) : (
            <ul className="divide-y">
              {topAdmins.map((admin, idx) => (
                <li
                  key={admin.id}
                  className="flex items-center justify-between gap-2 py-2 first:pt-0 last:pb-0"
                >
                  <p className="min-w-0 text-sm">
                    <span className="text-muted-foreground">{idx + 1}.</span>{" "}
                    <span className="font-semibold">{admin.name}</span>
                  </p>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {admin._count.activityLogs} กิจกรรม
                  </span>
                </li>
              ))}
            </ul>
          )}
        </WidgetCard>

        <WidgetCard
          href="/admin/activity-log"
          icon={Activity}
          title="กิจกรรมล่าสุด"
          className="sm:col-span-2"
        >
          {recentActivity.length === 0 ? (
            <EmptyHint>ยังไม่มีกิจกรรม</EmptyHint>
          ) : (
            <ul className="divide-y">
              {recentActivity.map((log) => (
                <li
                  key={log.id}
                  className="flex flex-col gap-1 py-2 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
                >
                  <p className="text-sm">
                    <span className="font-semibold">{log.profile.name}</span>{" "}
                    <span className="text-muted-foreground">
                      {ACTION_LABELS[log.action] ?? log.action}
                    </span>
                    {log.targetLabel && (
                      <span className="font-semibold"> · {log.targetLabel}</span>
                    )}
                  </p>
                  <span className="shrink-0 font-mono text-xs text-muted-foreground">
                    {timeAgo(log.createdAt)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </WidgetCard>
      </div>
    </div>
  );
}
