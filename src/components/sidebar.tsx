"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LogOut,
  LayoutDashboard,
  BookOpen,
  Wrench,
  ClipboardList,
  Users,
  Activity,
  Menu,
  X,
} from "lucide-react";
import Image from "next/image";
import { logout } from "@/actions/login";

const ICON_MAP = {
  LayoutDashboard,
  BookOpen,
  Wrench,
  ClipboardList,
  Users,
  Activity,
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
  headerActions?: React.ReactNode;
};

export function Sidebar({ navItems, userEmail, headerActions }: SidebarProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const activeHref =
    navItems.find((item) => pathname.startsWith(item.href))?.href ??
    navItems[0].href;

  const closeMobile = () => setMobileOpen(false);

  return (
    <>
      {/* Mobile top bar */}
      <header className="fixed inset-x-0 top-0 z-40 flex h-14 items-center gap-3 border-b bg-background/95 backdrop-blur-sm px-4 lg:hidden">
        <button
          onClick={() => setMobileOpen(true)}
          className="inline-flex items-center justify-center p-2 text-foreground/70 hover:text-foreground transition-colors"
          aria-label="เปิดเมนู"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div className="flex items-center gap-2.5">
          <Image src="/nurse_logo.svg" alt="Research Tools" width={20} height={20} />
          <span className="font-heading font-semibold text-sm tracking-wide">RESEARCH TOOLS</span>
        </div>
        {headerActions && <div className="ml-auto">{headerActions}</div>}
      </header>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={closeMobile}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border transition-transform duration-200 lg:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Logo area */}
        <div className="flex h-16 items-center justify-between px-5 border-b border-sidebar-border">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded bg-sidebar-accent">
              <Image src="/nurse_logo.svg" alt="" width={18} height={18} className="brightness-0 invert" />
            </div>
            <div>
              <span className="font-heading font-bold text-sm tracking-widest uppercase text-sidebar-foreground">
                Research Tools
              </span>
            </div>
          </div>
          <button
            onClick={closeMobile}
            className="inline-flex items-center justify-center p-1.5 text-sidebar-foreground/40 hover:text-sidebar-foreground lg:hidden transition-colors"
            aria-label="ปิดเมนู"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-0.5 px-3 py-4">
          {navItems.map((item) => {
            const isActive = activeHref === item.href;
            const Icon = ICON_MAP[item.icon];
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={closeMobile}
                className={`group relative flex items-center gap-3 px-3 py-2.5 text-sm transition-all duration-150 ${
                  isActive
                    ? "font-semibold text-sidebar-accent-foreground bg-sidebar-accent rounded"
                    : "text-sidebar-foreground/50 hover:text-sidebar-foreground hover:bg-sidebar-accent/10 rounded"
                }`}
              >
                {isActive && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-[3px] bg-sidebar-accent rounded-r" />
                )}
                <Icon className={`h-4 w-4 ${isActive ? "text-sidebar-accent-foreground" : "text-sidebar-foreground/40 group-hover:text-sidebar-foreground/70"}`} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* User footer */}
        <div className="border-t border-sidebar-border px-4 py-3">
          <p className="truncate text-xs text-sidebar-foreground/35 font-mono mb-2">
            {userEmail}
          </p>
          <form action={logout}>
            <button
              type="submit"
              className="flex w-full items-center gap-2.5 px-2 py-1.5 text-sm text-sidebar-foreground/40 hover:text-sidebar-foreground hover:bg-sidebar-accent/10 rounded transition-colors"
            >
              <LogOut className="h-3.5 w-3.5" />
              ออกจากระบบ
            </button>
          </form>
        </div>
      </aside>
    </>
  );
}
