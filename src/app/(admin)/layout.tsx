import { requireRole } from "@/lib/auth";
import { Sidebar } from "@/components/sidebar";
import type { NavItem } from "@/components/sidebar";
import { ActivityPanelTrigger } from "@/components/admin/activity-panel";
import { SearchButton } from "@/components/admin/search-button";

const ADMIN_NAV: NavItem[] = [
  { label: "แดชบอร์ด", href: "/admin/dashboard", icon: "LayoutDashboard" },
  { label: "เอกสารเครื่องมือวิจัย", href: "/admin/documents", icon: "FileText" },
  { label: "รายชื่อนักศึกษา", href: "/admin/students", icon: "Users" },
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
        headerActions={
          <>
            <SearchButton />
            <ActivityPanelTrigger />
          </>
        }
      />
      <main className="flex-1 pt-14 p-4 lg:p-6">{children}</main>
    </div>
  );
}
