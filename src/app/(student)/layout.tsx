import { requireRole } from "@/lib/auth";
import { Sidebar } from "@/components/sidebar";
import type { NavItem } from "@/components/sidebar";

const STUDENT_NAV: NavItem[] = [
  { label: "วิทยานิพนธ์ของฉัน", href: "/thesis", icon: "BookOpen" },
];

export default async function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { email } = await requireRole("STUDENT");

  return (
    <div className="student-theme flex min-h-screen">
      <Sidebar
        role="STUDENT"
        navItems={STUDENT_NAV}
        userEmail={email}
      />
      <main className="flex-1 pt-14 p-4 lg:p-6">{children}</main>
    </div>
  );
}
