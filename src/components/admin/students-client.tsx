"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, X } from "lucide-react";

type StudentRow = {
  id: string;
  name: string;
  studentId: string;
  docCount: number;
};

type StudentsClientProps = {
  students: StudentRow[];
  currentQuery: string;
  page: number;
  hasMore: boolean;
  totalPages: number;
};

export function StudentsClient({
  students,
  currentQuery,
  page,
  hasMore,
  totalPages,
}: StudentsClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchInput, setSearchInput] = useState(currentQuery);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

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
      router.push(`/admin/students?${params.toString()}`);
    }, 500);
  }, [searchParams, router]);

  useEffect(() => {
    if (document.activeElement !== inputRef.current) {
      setSearchInput(currentQuery);
    }
  }, [currentQuery]);

  function clearSearch() {
    setSearchInput("");
    if (timerRef.current) clearTimeout(timerRef.current);
    const params = new URLSearchParams(searchParams.toString());
    params.delete("q");
    params.delete("page");
    router.push(`/admin/students?${params.toString()}`);
  }

  function goToPage(p: number) {
    const params = new URLSearchParams(searchParams.toString());
    if (p <= 1) {
      params.delete("page");
    } else {
      params.set("page", String(p));
    }
    router.push(`/admin/students?${params.toString()}`);
  }

  return (
    <div className="space-y-4">
      <div className="relative w-full max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          ref={inputRef}
          value={searchInput}
          onChange={(e) => {
            setSearchInput(e.target.value);
            updateSearch(e.target.value);
          }}
          placeholder="ค้นหาจากชื่อ, รหัสนักศึกษา, ชื่อวิทยานิพนธ์..."
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

      {students.length === 0 ? (
        <div className="rounded border border-dashed p-10 text-center text-muted-foreground">
          ยังไม่มีนักศึกษาในระบบ
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto rounded border bg-card">
            <table className="w-full min-w-120 text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-3 text-left font-heading font-semibold text-xs uppercase tracking-wider text-muted-foreground">
                    ลำดับ
                  </th>
                  <th className="px-4 py-3 text-left font-heading font-semibold text-xs uppercase tracking-wider text-muted-foreground">
                    ชื่อ-นามสกุล
                  </th>
                  <th className="px-4 py-3 text-left font-heading font-semibold text-xs uppercase tracking-wider text-muted-foreground">
                    รหัสนักศึกษา
                  </th>
                  <th className="px-4 py-3 text-left font-heading font-semibold text-xs uppercase tracking-wider text-muted-foreground">
                    จำนวนเอกสาร
                  </th>
                </tr>
              </thead>
              <tbody>
                {students.map((student, i) => (
                  <tr
                    key={student.id}
                    className="border-t transition-colors hover:bg-muted/30"
                  >
                    <td className="px-4 py-3 text-muted-foreground">{(page - 1) * 20 + i + 1}</td>
                    <td className="px-4 py-3 font-medium">
                      <Link
                        href={`/admin/students/${student.id}`}
                        className="text-primary hover:underline"
                      >
                        {student.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground font-mono text-xs">
                      {student.studentId}
                    </td>
                    <td className="px-4 py-3">
                      {student.docCount}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {students.map((student) => (
              <Link
                key={student.id}
                href={`/admin/students/${student.id}`}
                className="block rounded border bg-card p-4 transition-colors hover:bg-muted/30"
              >
                <div className="flex items-center justify-between">
                  <p className="font-medium text-sm">{student.name}</p>
                  <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-semibold">
                    {student.docCount} เอกสาร
                  </span>
                </div>
                <p className="text-xs text-muted-foreground font-mono mt-1">
                  {student.studentId}
                </p>
              </Link>
            ))}
          </div>
        </>
      )}

      {(page > 1 || hasMore) && (
        <Pagination page={page} totalPages={totalPages} onPageChange={goToPage} />
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
      </Button>
    </div>
  );
}
