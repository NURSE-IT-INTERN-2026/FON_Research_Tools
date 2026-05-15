import Link from "next/link";
import type { LucideIcon } from "lucide-react";

type StatCardProps = {
  icon: LucideIcon;
  value: number;
  label: string;
  href: string;
};

export function StatCard({ icon: Icon, value, label, href }: StatCardProps) {
  return (
    <Link
      href={href}
      className="group rounded-xl border bg-card p-5 transition-shadow hover:shadow-md"
    >
      <div className="flex items-center gap-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-2xl font-bold">{value}</p>
          <p className="text-sm text-muted-foreground">{label}</p>
        </div>
      </div>
    </Link>
  );
}
