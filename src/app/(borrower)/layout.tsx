import { requireRole } from "@/lib/auth";
import { Sidebar } from "@/components/sidebar";
import type { NavItem } from "@/components/sidebar";

const BORROWER_NAV: NavItem[] = [
  { label: "แดชบอร์ด", href: "/dashboard", icon: "LayoutDashboard" },
  { label: "การจองของฉัน", href: "/my-bookings", icon: "BookOpen" },
];

export default async function BorrowerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { email } = await requireRole("BORROWER");

  return (
    <div className="borrower-theme flex min-h-screen">
      <Sidebar
        role="BORROWER"
        navItems={BORROWER_NAV}
        userEmail={email}
      />
      <main className="ml-64 flex-1 p-6">{children}</main>
    </div>
  );
}
