"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Microscope,
  LogOut,
  LayoutDashboard,
  BookOpen,
  Wrench,
  ClipboardList,
  Users,
} from "lucide-react";
import { logout } from "@/actions/login";

const ICON_MAP = {
  LayoutDashboard,
  BookOpen,
  Wrench,
  ClipboardList,
  Users,
} as const;

export type IconName = keyof typeof ICON_MAP;

export type NavItem = {
  label: string;
  href: string;
  icon: IconName;
};

type SidebarProps = {
  role: "ADMIN" | "BORROWER";
  navItems: NavItem[];
  userEmail: string;
};

export function Sidebar({ navItems, userEmail }: SidebarProps) {
  const pathname = usePathname();

  const activeHref =
    navItems.find((item) => pathname.startsWith(item.href))?.href ??
    navItems[0].href;

  return (
    <aside className="fixed inset-y-0 left-0 z-30 flex w-64 flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border">
      <div className="flex h-16 items-center gap-2 px-6 border-b border-sidebar-border">
        <Microscope className="h-6 w-6 text-sidebar-primary" />
        <span className="text-lg font-semibold text-sidebar-foreground">
          ToolLend
        </span>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {navItems.map((item) => {
          const isActive = activeHref === item.href;
          const Icon = ICON_MAP[item.icon];
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/10 hover:text-sidebar-foreground"
              }`}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-sidebar-border px-4 py-3">
        <p className="truncate text-xs text-sidebar-foreground/60 mb-2">
          {userEmail}
        </p>
        <form action={logout}>
          <button
            type="submit"
            className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-sidebar-foreground/70 hover:bg-sidebar-accent/10 hover:text-sidebar-foreground transition-colors"
          >
            <LogOut className="h-4 w-4" />
            ออกจากระบบ
          </button>
        </form>
      </div>
    </aside>
  );
}
