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
      className="group relative overflow-hidden rounded border bg-card p-5 transition-all hover:border-primary/30 hover:shadow-md"
    >
      <div className="absolute top-0 left-0 w-full h-0.75 bg-primary/10 group-hover:bg-primary/30 transition-colors" />
      <div className="flex items-center gap-4">
        <div className="flex h-10 w-10 items-center justify-center rounded bg-primary/10 text-primary">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="font-heading text-3xl font-bold tracking-tight">{value}</p>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
        </div>
      </div>
    </Link>
  );
}
