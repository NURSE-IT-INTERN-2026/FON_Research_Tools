import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  Card,
  CardHeader,
  CardTitle,
  CardAction,
  CardContent,
} from "@/components/ui/card";
import { ChevronRight, type LucideIcon } from "lucide-react";

export function WidgetCard({
  href,
  icon: Icon,
  title,
  children,
  className,
}: {
  href: string;
  icon: LucideIcon;
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Link href={href} className={cn("group block", className)}>
      <Card className="h-full rounded border transition-all group-hover:border-primary/30 group-hover:shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-heading text-base font-bold tracking-tight">
            <Icon className="h-4 w-4 text-primary" />
            {title}
          </CardTitle>
          <CardAction>
            <ChevronRight className="h-4 w-4 text-muted-foreground transition-colors group-hover:text-primary" />
          </CardAction>
        </CardHeader>
        <CardContent>{children}</CardContent>
      </Card>
    </Link>
  );
}

export function EmptyHint({ children }: { children: React.ReactNode }) {
  return <p className="py-4 text-center text-sm text-muted-foreground">{children}</p>;
}
