"use client";

import { Suspense, useState, useRef, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FilterPills } from "@/components/filter-pills";
import { Search, X } from "lucide-react";

const ROLE_LABELS: Record<string, string> = {
  ADMIN: "เจ้าหน้าที่",
  STUDENT: "นักศึกษา",
};

const ROLE_OPTIONS = [
  { label: "ทั้งหมด", value: "ALL" },
  { label: "เจ้าหน้าที่", value: "ADMIN" },
  { label: "นักศึกษา", value: "STUDENT" },
];

type UserRow = {
  id: string;
  name: string;
  email: string;
  role: string;
};

type UsersClientProps = {
  users: UserRow[];
  currentQuery: string;
  currentRole: string;
  page: number;
  hasMore: boolean;
};

export function UsersClient({
  users,
  currentQuery,
  currentRole,
  page,
  hasMore,
}: UsersClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchInput, setSearchInput] = useState(currentQuery);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const updateSearch = useCallback((value: string) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set("q", value);
      } else {
        params.delete("q");
      }
      params.delete("page");
      router.push(`/admin/users?${params.toString()}`);
    }, 300);
  }, [searchParams, router]);

  function clearSearch() {
    setSearchInput("");
    if (timerRef.current) clearTimeout(timerRef.current);
    const params = new URLSearchParams(searchParams.toString());
    params.delete("q");
    params.delete("page");
    router.push(`/admin/users?${params.toString()}`);
  }

  function goToPage(p: number) {
    const params = new URLSearchParams(searchParams.toString());
    if (p <= 1) {
      params.delete("page");
    } else {
      params.set("page", String(p));
    }
    router.push(`/admin/users?${params.toString()}`);
  }

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchInput}
            onChange={(e) => {
              setSearchInput(e.target.value);
              updateSearch(e.target.value);
            }}
            placeholder="ค้นหาจากชื่อ, อีเมล..."
            className="rounded pl-9 pr-8"
          />
          {searchInput && (
            <button
              type="button"
              onClick={clearSearch}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Suspense>
            <FilterPills
              paramName="role"
              options={ROLE_OPTIONS}
              selected={currentRole}
              basePath="/admin/users"
              resetParams={["page"]}
            />
          </Suspense>
        </div>
      </div>

      {users.length === 0 ? (
        <div className="rounded border border-dashed p-10 text-center text-muted-foreground">
          ยังไม่มีผู้ใช้งานในระบบ
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto rounded border bg-card">
            <table className="w-full min-w-135 text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-3 text-left font-heading font-semibold text-xs uppercase tracking-wider text-muted-foreground">ลำดับ</th>
                  <th className="px-4 py-3 text-left font-heading font-semibold text-xs uppercase tracking-wider text-muted-foreground">ชื่อ</th>
                  <th className="px-4 py-3 text-left font-heading font-semibold text-xs uppercase tracking-wider text-muted-foreground">อีเมล</th>
                  <th className="px-4 py-3 text-left font-heading font-semibold text-xs uppercase tracking-wider text-muted-foreground">บทบาท</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user, i) => (
                  <tr
                    key={user.id}
                    className="border-t transition-colors hover:bg-muted/30"
                  >
                    <td className="px-4 py-3 text-muted-foreground">{(page - 1) * 20 + i + 1}</td>
                    <td className="px-4 py-3 font-medium">{user.name}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {user.email}
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded bg-muted px-2 py-0.5 text-xs font-semibold">
                        {ROLE_LABELS[user.role] ?? "—"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {users.map((user) => (
              <div key={user.id} className="rounded border bg-card p-4">
                <div className="flex items-center justify-between">
                  <p className="font-medium text-sm">{user.name}</p>
                  <span className="rounded bg-muted px-2 py-0.5 text-xs font-semibold">
                    {ROLE_LABELS[user.role] ?? "—"}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1 truncate">{user.email}</p>
              </div>
            ))}
          </div>
        </>
      )}

      {(page > 1 || hasMore) && (
        <Pagination page={page} hasMore={hasMore} onPageChange={goToPage} />
      )}
    </div>
  );
}

function Pagination({
  page,
  hasMore,
  onPageChange,
}: {
  page: number;
  hasMore: boolean;
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
        ก่อนหน้า
      </Button>
      <span className="text-xs text-muted-foreground px-2">
        หน้า {page} / {hasMore ? "…" : page}
      </span>
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={!hasMore}
        onClick={() => onPageChange(page + 1)}
        className="rounded text-xs"
      >
        ถัดไป
      </Button>
    </div>
  );
}
