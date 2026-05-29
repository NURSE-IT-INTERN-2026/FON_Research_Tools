"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, ChevronLeft, ChevronRight, CheckCircle, ChevronsUpDown, Check } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FilterPills } from "@/components/filter-pills";
import { formatDateTime, cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { ACTION_LABELS, ACTION_ICONS, ACTION_COLORS, ACTION_OPTIONS, TARGET_OPTIONS } from "@/lib/activity-meta";
import { AppDatePicker } from "@/components/ui/app-date-picker";

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

type UserGroups = {
  admins: UserOption[];
  students: UserOption[];
};

type ActivityLogClientProps = {
  logs: LogEntry[];
  users: UserGroups;
  page: number;
  hasMore: boolean;
  currentFilters: {
    action?: string;
    targetType?: string;
    userId?: string;
    userRole?: string;
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
      <AppDatePicker
        value={from}
        onChange={(v) => updateDate("from", v)}
        tone="admin"
        size="md"
        placeholder="จากวันที่"
        className="text-xs"
      />
      <span className="text-xs text-muted-foreground">ถึง</span>
      <AppDatePicker
        value={to}
        onChange={(v) => updateDate("to", v)}
        tone="admin"
        size="md"
        placeholder="ถึงวันที่"
        className="text-xs"
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

export function ActivityLogClient({ logs, users, page, hasMore, totalPages, currentFilters }: ActivityLogClientProps & { hasMore: boolean; totalPages: number }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [userOpen, setUserOpen] = useState(false);

  const currentRole = currentFilters.userRole || "ALL";
  const roleUsers = currentRole === "ADMIN"
    ? users.admins
    : currentRole === "STUDENT"
    ? users.students
    : [...users.admins, ...users.students];

  function updateUserRole(role: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (role === "ALL") {
      params.delete("userRole");
    } else {
      params.set("userRole", role);
    }
    params.delete("userId");
    params.delete("page");
    router.push(`/admin/activity-log?${params.toString()}`);
  }

  function updateUserId(userId: string) {
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
            <div className="flex flex-wrap items-center gap-1.5">
              {[
                { value: "ALL", label: "ทั้งหมด" },
                { value: "ADMIN", label: "เจ้าหน้าที่" },
                { value: "STUDENT", label: "นักศึกษา" },
              ].map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => updateUserRole(opt.value)}
                  className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                    currentRole === opt.value
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background text-muted-foreground border-input hover:bg-muted"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            {roleUsers.length > 0 && (
              <Popover open={userOpen} onOpenChange={setUserOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={userOpen}
                    className="h-8 w-full justify-between rounded text-xs font-normal mt-1.5"
                  >
                    {currentFilters.userId
                      ? roleUsers.find((u) => u.id === currentFilters.userId)?.name
                      : "— เลือกผู้ใช้ —"}
                    <ChevronsUpDown className="ml-2 h-3.5 w-3.5 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0 rounded" align="start">
                  <Command>
                    <CommandInput placeholder="ค้นหาผู้ใช้..." />
                    <CommandList>
                      <CommandEmpty>ไม่พบผู้ใช้</CommandEmpty>
                      <CommandGroup>
                        <CommandItem
                          value="ทั้งหมด"
                          onSelect={() => { updateUserId("ALL"); setUserOpen(false); }}
                        >
                          <Check className={cn("mr-2 h-3.5 w-3.5", !currentFilters.userId ? "opacity-100" : "opacity-0")} />
                          ทั้งหมด
                        </CommandItem>
                        {roleUsers.map((u) => (
                          <CommandItem
                            key={u.id}
                            value={u.name}
                            onSelect={() => { updateUserId(u.id); setUserOpen(false); }}
                          >
                            <Check className={cn("mr-2 h-3.5 w-3.5", currentFilters.userId === u.id ? "opacity-100" : "opacity-0")} />
                            {u.name}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            )}
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
