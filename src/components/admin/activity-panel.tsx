"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  getRecentActivity,
  type ActivityEntry,
} from "@/actions/activity-actions";
import { formatDateTime } from "@/lib/utils";
import { ACTION_LABELS, ACTION_ICONS, ACTION_COLORS } from "@/lib/activity-meta";
import { CheckCircle } from "lucide-react";

function ActivityItem({ entry }: { entry: ActivityEntry }) {
  const Icon = ACTION_ICONS[entry.action] ?? CheckCircle;
  const colorClass = ACTION_COLORS[entry.action] ?? "text-muted-foreground bg-muted";

  return (
    <div className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
      <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded ${colorClass}`}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm leading-snug">
          <span className="font-semibold">{entry.userName}</span>{" "}
          <span className="text-muted-foreground">{ACTION_LABELS[entry.action] ?? entry.action}</span>
        </p>
        {entry.targetLabel && (
          <p className="text-xs text-muted-foreground truncate mt-0.5">{entry.targetLabel}</p>
        )}
      </div>
      <span className="shrink-0 text-xs text-muted-foreground font-mono pt-0.5">
        {formatDateTime(entry.createdAt)}
      </span>
    </div>
  );
}

function ActivityPanel({
  open,
  onOpenChange,
  logs,
  loading,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  logs: ActivityEntry[];
  loading: boolean;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:w-96 sm:max-w-md p-0 flex flex-col">
        <SheetHeader className="px-5 pt-5 pb-3 border-b">
          <SheetTitle className="font-heading font-bold tracking-tight text-left">
            กิจกรรมล่าสุด
          </SheetTitle>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto px-5 py-2">
          {loading ? (
            <div className="flex items-center justify-center py-10 text-sm text-muted-foreground">
              กำลังโหลด...
            </div>
          ) : logs.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">ยังไม่มีกิจกรรม</p>
          ) : (
            <div className="divide-y">
              {logs.map((entry) => (
                <ActivityItem key={entry.id} entry={entry} />
              ))}
            </div>
          )}
        </div>
        <div className="border-t px-5 py-3">
          <Link
            href="/admin/activity-log"
            onClick={() => onOpenChange(false)}
            className="block text-center text-sm font-semibold text-primary hover:underline underline-offset-4"
          >
            ดูทั้งหมด
          </Link>
        </div>
      </SheetContent>
    </Sheet>
  );
}

export function ActivityPanelTrigger() {
  const [open, setOpen] = useState(false);
  const [logs, setLogs] = useState<ActivityEntry[]>([]);
  const [loading, setLoading] = useState(false);

  const handleOpen = useCallback(async (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (nextOpen) {
      setLoading(true);
      try {
        const data = await getRecentActivity();
        setLogs(data);
      } finally {
        setLoading(false);
      }
    }
  }, []);

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => handleOpen(true)}
        className="relative rounded"
        aria-label="กิจกรรมล่าสุด"
      >
        <Bell className="h-5 w-5" />
      </Button>
      <ActivityPanel open={open} onOpenChange={handleOpen} logs={logs} loading={loading} />
    </>
  );
}
