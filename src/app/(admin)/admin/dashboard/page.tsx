import db from "@/lib/db";
import { StatCard } from "@/components/stat-card";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { Wrench, PackageCheck, Clock, AlertTriangle } from "lucide-react";

const VERB_MAP: Record<string, string> = {
  PENDING: "ยื่นคำขอยืม",
  APPROVED: "ได้รับการอนุมัติยืม",
  REJECTED: "ถูกปฏิเสธยืม",
  RETURNED: "คืน",
  OVERDUE: "เกินกำหนดคืน",
};

function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "เมื่อสักครู่";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} นาทีที่แล้ว`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} ชั่วโมงที่แล้ว`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} วันที่แล้ว`;
  return date.toLocaleDateString("th-TH");
}

export default async function AdminDashboardPage() {
  const [totalTools, borrowedTools, pendingRequests, overdueReturns, recentBookings] =
    await Promise.all([
      db.tool.count({ where: { isActive: true } }),
      db.tool.count({ where: { status: "BORROWED" } }),
      db.booking.count({ where: { status: "PENDING" } }),
      db.booking.count({ where: { status: "OVERDUE" } }),
      db.booking.findMany({
        take: 10,
        orderBy: { updatedAt: "desc" },
        include: {
          profile: { select: { name: true } },
          tool: { select: { name: true } },
        },
      }),
    ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">แดชบอร์ด</h1>
        <p className="text-muted-foreground mt-1">ภาพรวมการจัดการอุปกรณ์</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
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

      <Card>
        <CardHeader>
          <CardTitle>กิจกรรมล่าสุด</CardTitle>
        </CardHeader>
        <CardContent>
          {recentBookings.length === 0 ? (
            <p className="py-4 text-center text-muted-foreground">
              ยังไม่มีกิจกรรม
            </p>
          ) : (
            <div className="divide-y">
              {recentBookings.map((booking) => (
                <div
                  key={booking.id}
                  className="flex items-center justify-between py-3 first:pt-0 last:pb-0"
                >
                  <p className="text-sm">
                    <span className="font-medium">
                      {booking.profile.name}
                    </span>{" "}
                    <span className="text-muted-foreground">
                      {VERB_MAP[booking.status]}
                    </span>{" "}
                    <span className="font-medium">{booking.tool.name}</span>
                  </p>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {timeAgo(booking.updatedAt)}
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
