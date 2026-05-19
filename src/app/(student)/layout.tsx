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
      <div className="flex flex-1 flex-col lg:ml-64">
        <main className="flex-1 p-4 pt-18 lg:p-6 lg:pt-4">{children}</main>
      </div>
    </div>
  );
}
