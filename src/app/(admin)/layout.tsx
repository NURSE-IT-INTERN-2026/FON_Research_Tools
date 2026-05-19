import { requireRole } from "@/lib/auth";
import { Sidebar } from "@/components/sidebar";
import type { NavItem } from "@/components/sidebar";
import { ActivityPanelTrigger } from "@/components/admin/activity-panel";

const ADMIN_NAV: NavItem[] = [
  { label: "แดชบอร์ด", href: "/admin/dashboard", icon: "LayoutDashboard" },
  { label: "เอกสารเครื่องมือวิจัย", href: "/admin/documents", icon: "FileText" },
  { label: "รายชื่อนักศึกษา", href: "/admin/users", icon: "Users" },
  { label: "จัดการผู้ดูแล", href: "/admin/admins", icon: "Shield" },
  { label: "บันทึกกิจกรรม", href: "/admin/activity-log", icon: "Activity" },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { email } = await requireRole("ADMIN");

  return (
    <div className="admin-theme flex min-h-screen">
      <Sidebar
        role="ADMIN"
        navItems={ADMIN_NAV}
        userEmail={email}
        headerActions={<ActivityPanelTrigger />}
      />
      <div className="flex flex-1 flex-col lg:ml-64">
        <header className="sticky top-0 z-30 hidden lg:flex h-14 items-center justify-between border-b bg-background/95 backdrop-blur-sm px-6">
          <div />
          <ActivityPanelTrigger />
        </header>
        <main className="flex-1 p-4 pt-18 lg:p-6 lg:pt-4">{children}</main>
      </div>
    </div>
  );
}
