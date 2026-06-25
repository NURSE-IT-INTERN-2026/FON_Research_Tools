"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LogOut,
  LayoutDashboard,
  BookOpen,
  FileText,
  Users,
  Activity,
  Menu,
  Shield,
  Package,
  Code,
} from "lucide-react";
import { logout } from "@/actions/logout";

const ICON_MAP = {
  LayoutDashboard,
  BookOpen,
  FileText,
  Users,
  Activity,
  Shield,
  Package,
  Code,
} as const;

export type IconName = keyof typeof ICON_MAP;

export type NavItem = {
  label: string;
  href: string;
  icon: IconName;
};

type NavbarProps = {
  role: "ADMIN" | "STUDENT";
  navItems: NavItem[];
  userEmail: string;
  headerActions?: React.ReactNode;
};

export function Sidebar({ navItems, userEmail, headerActions }: NavbarProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const activeHref =
    navItems.find((item) => pathname.startsWith(item.href))?.href ??
    navItems[0].href;

  const closeMobile = () => setMobileOpen(false);

  return (
    <>
      {/* Top navbar */}
      <header className="fixed inset-x-0 top-0 z-40 flex h-14 items-center border-b bg-sidebar text-sidebar-foreground backdrop-blur-sm">
        {/* Left: hamburger (mobile) + logo */}
        <div className="flex items-center gap-2.5 px-4">
          <button
            onClick={() => setMobileOpen(true)}
            className="inline-flex items-center justify-center p-2 text-sidebar-foreground/70 hover:text-sidebar-foreground lg:hidden transition-colors"
            aria-label="เปิดเมนู"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/nurse_logo.svg`} alt="Research Tools" width={20} height={20} style={{ filter: "brightness(0) saturate(100%) invert(48%) sepia(79%) saturate(2476%) hue-rotate(14deg) brightness(98%) contrast(97%)" }} />
            <span className="font-heading font-bold text-sm tracking-widest uppercase">
              Research Tools
            </span>
          </div>
        </div>

        {/* Center: desktop nav links */}
        <nav className="hidden lg:flex items-center gap-1 ml-8">
          {navItems.map((item) => {
            const isActive = activeHref === item.href;
            const Icon = ICON_MAP[item.icon];
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2 px-3 py-1.5 text-sm rounded transition-colors ${
                  isActive
                    ? "font-semibold bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent/10"
                }`}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Right: actions + user */}
        <div className="ml-auto flex items-center gap-2 px-4">
          {headerActions}
          <span className="hidden sm:inline text-xs text-sidebar-foreground/40 font-mono truncate max-w-[200px]">
            {userEmail}
          </span>
          <form action={logout}>
            <button
              type="submit"
              className="hidden lg:flex items-center gap-2 px-2.5 py-1.5 text-sm text-sidebar-foreground/50 hover:text-sidebar-foreground hover:bg-sidebar-accent/10 rounded transition-colors"
            >
              <LogOut className="h-3.5 w-3.5" />
              ออกจากระบบ
            </button>
          </form>
        </div>
      </header>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={closeMobile}
          aria-hidden="true"
        />
      )}

      {/* Mobile dropdown menu */}
      {mobileOpen && (
        <div className="fixed top-14 inset-x-0 z-50 border-b bg-sidebar text-sidebar-foreground shadow-lg lg:hidden animate-slide-up">
          <nav className="space-y-0.5 px-3 py-3">
            {navItems.map((item) => {
              const isActive = activeHref === item.href;
              const Icon = ICON_MAP[item.icon];
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={closeMobile}
                  className={`flex items-center gap-3 px-3 py-2.5 text-sm rounded transition-colors ${
                    isActive
                      ? "font-semibold bg-sidebar-accent text-sidebar-accent-foreground"
                      : "text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent/10"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <div className="border-t border-sidebar-border px-3 py-3">
            <form action={logout}>
              <button
                type="submit"
                className="flex w-full items-center gap-3 px-3 py-2.5 text-sm text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent/10 rounded transition-colors"
              >
                <LogOut className="h-4 w-4" />
                ออกจากระบบ
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
