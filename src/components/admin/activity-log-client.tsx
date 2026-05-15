"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { FilterPills } from "@/components/filter-pills";
import { CheckCircle } from "lucide-react";
import { timeAgo } from "@/lib/utils";
import { ACTION_LABELS, ACTION_ICONS, ACTION_COLORS, ACTION_OPTIONS, TARGET_OPTIONS } from "@/lib/activity-meta";

type LogEntry = {
  id: string;
  action: string;
  userName: string;
  userEmail: string;
  targetType: string | null;
  targetId: string | null;
  targetLabel: string | null;
  metadata: string | null;
  createdAt: string;
};

type UserOption = {
  id: string;
  name: string;
};

type ActivityLogClientProps = {
  logs: LogEntry[];
  users: UserOption[];
  hasMore: boolean;
  currentFilters: {
    action?: string;
    targetType?: string;
    userId?: string;
    q?: string;
    take?: string;
  };
};

function SearchBar({ initialQuery }: { initialQuery: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(initialQuery);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    if (query) {
      params.set("q", query);
    } else {
      params.delete("q");
    }
    router.push(`/admin/activity-log?${params.toString()}`);
  }

  return (
    <form onSubmit={handleSubmit} className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input
        type="search"
        placeholder="ค้นหากิจกรรม..."
        className="pl-9 rounded"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
    </form>
  );
}

export function ActivityLogClient({ logs, users, hasMore, currentFilters }: ActivityLogClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function updateUserFilter(userId: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (userId === "ALL") {
      params.delete("userId");
    } else {
      params.set("userId", userId);
    }
    params.delete("take");
    router.push(`/admin/activity-log?${params.toString()}`);
  }

  function loadMore() {
    const params = new URLSearchParams(searchParams.toString());
    const current = parseInt(params.get("take") ?? "50", 10);
    params.set("take", String(current + 50));
    router.push(`/admin/activity-log?${params.toString()}`);
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="rounded border bg-card p-4 space-y-4">
        <Suspense>
          <SearchBar initialQuery={currentFilters.q ?? ""} />
        </Suspense>
        <div className="flex flex-wrap items-start gap-6">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">การดำเนินการ</p>
            <FilterPills
              paramName="action"
              options={ACTION_OPTIONS}
              selected={currentFilters.action || "ALL"}
              basePath="/admin/activity-log"
            />
          </div>
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">ประเภทเป้าหมาย</p>
            <FilterPills
              paramName="targetType"
              options={TARGET_OPTIONS}
              selected={currentFilters.targetType || "ALL"}
              basePath="/admin/activity-log"
            />
          </div>
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">ผู้ใช้</p>
            <select
              value={currentFilters.userId || "ALL"}
              onChange={(e) => updateUserFilter(e.target.value)}
              className="flex h-8 rounded border border-input bg-background px-2 text-xs shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <option value="ALL">ทั้งหมด</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>{u.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Results */}
      {logs.length === 0 ? (
        <div className="rounded border border-dashed p-10 text-center text-muted-foreground">
          ไม่พบกิจกรรม
        </div>
      ) : (
        <div className="space-y-0 divide-y rounded border bg-card">
          {logs.map((log) => {
            const Icon = ACTION_ICONS[log.action] ?? CheckCircle;
            const colorClass = ACTION_COLORS[log.action] ?? "text-muted-foreground bg-muted";
            return (
              <div key={log.id} className="flex items-start gap-3 px-4 py-3 hover:bg-muted/30 transition-colors">
                <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded ${colorClass}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm">
                    <span className="font-semibold">{log.userName}</span>{" "}
                    <span className="text-muted-foreground">{ACTION_LABELS[log.action] ?? log.action}</span>
                  </p>
                  {log.targetLabel && (
                    <p className="text-xs text-muted-foreground mt-0.5">{log.targetLabel}</p>
                  )}
                </div>
                <span className="shrink-0 text-xs text-muted-foreground font-mono pt-0.5">
                  {timeAgo(log.createdAt)}
                </span>
              </div>
            );
          })}
        </div>
      )}
      {hasMore && logs.length > 0 && (
        <div className="flex justify-center">
          <button
            onClick={loadMore}
            className="text-sm font-semibold text-primary hover:underline underline-offset-4 py-2"
          >
            โหลดเพิ่มเติม
          </button>
        </div>
      )}
    </div>
  );
}
