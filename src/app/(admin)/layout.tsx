import { requireRole } from "@/lib/auth";
import { Sidebar } from "@/components/sidebar";
import type { NavItem } from "@/components/sidebar";

const ADMIN_NAV: NavItem[] = [
  { label: "แดชบอร์ด", href: "/admin/dashboard", icon: "LayoutDashboard" },
  { label: "คลังอุปกรณ์", href: "/admin/inventory", icon: "Wrench" },
  { label: "คำขอยืม", href: "/admin/requests", icon: "ClipboardList" },
  { label: "ผู้ใช้งาน", href: "/admin/users", icon: "Users" },
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
      />
      <main className="ml-64 flex-1 p-6">{children}</main>
    </div>
  );
}
