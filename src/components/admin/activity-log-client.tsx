"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, ChevronLeft, ChevronRight, CheckCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FilterPills } from "@/components/filter-pills";
import { formatDateTime } from "@/lib/utils";
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
  page: number;
  hasMore: boolean;
  currentFilters: {
    action?: string;
    targetType?: string;
    userId?: string;
    q?: string;
    page?: string;
    from?: string;
    to?: string;
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
    params.delete("page");
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

function DateRangeFilter({
  from,
  to,
}: {
  from: string;
  to: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function updateDate(field: "from" | "to", value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(field, value);
    } else {
      params.delete(field);
    }
    params.delete("page");
    router.push(`/admin/activity-log?${params.toString()}`);
  }

  function clearDates() {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("from");
    params.delete("to");
    params.delete("page");
    router.push(`/admin/activity-log?${params.toString()}`);
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Input
        type="date"
        value={from}
        onChange={(e) => updateDate("from", e.target.value)}
        className="h-8 rounded text-xs w-full sm:w-auto"
      />
      <span className="text-xs text-muted-foreground">ถึง</span>
      <Input
        type="date"
        value={to}
        onChange={(e) => updateDate("to", e.target.value)}
        className="h-8 rounded text-xs w-full sm:w-auto"
      />
      {(from || to) && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={clearDates}
          className="h-8 text-xs text-muted-foreground px-2"
        >
          ล้าง
        </Button>
      )}
    </div>
  );
}

function Pagination({
  page,
  totalPages,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  onPageChange: (p: number) => void;
}) {
  return (
    <div className="flex items-center justify-center gap-2">
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
        className="rounded text-xs"
      >
        <ChevronLeft className="h-3.5 w-3.5 mr-1" />
        ก่อนหน้า
      </Button>
      <span className="text-xs text-muted-foreground px-2">
        หน้า {page} / {totalPages}
      </span>
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={page >= totalPages}
        onClick={() => onPageChange(page + 1)}
        className="rounded text-xs"
      >
        ถัดไป
        <ChevronRight className="h-3.5 w-3.5 ml-1" />
      </Button>
    </div>
  );
}

export function ActivityLogClient({ logs, users, page, hasMore, totalPages, currentFilters }: ActivityLogClientProps & { totalPages: number }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function updateUserFilter(userId: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (userId === "ALL") {
      params.delete("userId");
    } else {
      params.set("userId", userId);
    }
    params.delete("page");
    router.push(`/admin/activity-log?${params.toString()}`);
  }

  function goToPage(p: number) {
    const params = new URLSearchParams(searchParams.toString());
    if (p <= 1) {
      params.delete("page");
    } else {
      params.set("page", String(p));
    }
    router.push(`/admin/activity-log?${params.toString()}`);
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="rounded border bg-card p-4 space-y-4">
        <Suspense>
          <SearchBar initialQuery={currentFilters.q ?? ""} />
        </Suspense>
        <div className="flex flex-wrap items-start gap-4 sm:gap-6">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">การดำเนินการ</p>
            <FilterPills
              paramName="action"
              options={ACTION_OPTIONS}
              selected={currentFilters.action || "ALL"}
              basePath="/admin/activity-log"
              resetParams={["page"]}
            />
          </div>
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">ประเภทเป้าหมาย</p>
            <FilterPills
              paramName="targetType"
              options={TARGET_OPTIONS}
              selected={currentFilters.targetType || "ALL"}
              basePath="/admin/activity-log"
              resetParams={["page"]}
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
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">ช่วงวันที่</p>
            <Suspense>
              <DateRangeFilter
                from={currentFilters.from ?? ""}
                to={currentFilters.to ?? ""}
              />
            </Suspense>
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
                <div className="flex-1 min-w-0 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-1 sm:gap-3">
                  <div className="min-w-0">
                    <p className="text-sm">
                      <span className="font-semibold">{log.userName}</span>{" "}
                      <span className="text-muted-foreground">{ACTION_LABELS[log.action] ?? log.action}</span>
                    </p>
                    {log.targetLabel && (
                      <p className="text-xs text-muted-foreground mt-0.5">{log.targetLabel}</p>
                    )}
                  </div>
                  <span className="shrink-0 text-xs text-muted-foreground font-mono">
                    {formatDateTime(log.createdAt)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {(page > 1 || hasMore) && (
        <Pagination page={page} totalPages={totalPages} onPageChange={goToPage} />
      )}
    </div>
  );
}
