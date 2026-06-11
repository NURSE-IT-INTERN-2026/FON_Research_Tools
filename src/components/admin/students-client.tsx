"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, X, RefreshCw, Users, FileText, FileQuestion, GraduationCap } from "lucide-react";

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

type StudentRow = {
  id: string;
  name: string;
  studentId: string;
  thesisTitleTh: string | null;
  thesisTitleEn: string | null;
  level: string | null;
  docCount: number;
};

type StudentsClientProps = {
  students: StudentRow[];
  currentQuery: string;
  currentLevel: string;
  currentThesis: string;
  page: number;
  hasMore: boolean;
  totalPages: number;
  stats: {
    total: number;
    withThesis: number;
    withoutThesis: number;
    master: number;
    phd: number;
    none: number;
  };
};

const LEVEL_TABS = [
  { key: "", label: "ทั้งหมด" },
  { key: "ปริญญาโท", label: "ปริญญาโท" },
  { key: "ปริญญาเอก", label: "ปริญญาเอก" },
  { key: "none", label: "ไม่ระบุ" },
] as const;

export function StudentsClient({
  students,
  currentQuery,
  currentLevel,
  currentThesis,
  page,
  hasMore,
  totalPages,
  stats,
}: StudentsClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchInput, setSearchInput] = useState(currentQuery);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<{
    total: number;
    created: number;
    updated: number;
  } | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);
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

  function setLevelFilter(level: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (level) {
      params.set("level", level);
    } else {
      params.delete("level");
    }
    params.delete("page");
    router.push(`/admin/students?${params.toString()}`);
  }

  function setThesisFilter(thesis: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (thesis) {
      params.set("thesis", thesis);
    } else {
      params.delete("thesis");
    }
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

  async function handleSync() {
    setSyncing(true);
    setSyncResult(null);
    setSyncError(null);

    try {
      const res = await fetch(`${BASE_PATH}/api/students/sync`, { method: "POST" });
      const data = await res.json();

      if (!res.ok) {
        setSyncError(data.error || "เกิดข้อผิดพลาด");
        return;
      }

      setSyncResult(data);
      router.refresh();
    } catch {
      setSyncError("ไม่สามารถเชื่อมต่อกับระบบได้");
    } finally {
      setSyncing(false);
    }
  }

  const levelCounts: Record<string, number> = {
    "": stats.total,
    "ปริญญาโท": stats.master,
    "ปริญญาเอก": stats.phd,
    none: stats.none,
  };

  return (
    <div className="space-y-4">
      {/* Stats cards — clickable filters */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <button
          onClick={() => setThesisFilter("")}
          className={`rounded-lg border p-4 flex items-center gap-3 transition-colors text-left ${
            currentThesis === "" ? "border-purple-400 bg-purple-50 ring-1 ring-purple-400" : "bg-card hover:bg-muted/30"
          }`}
        >
          <div className="rounded-full bg-purple-100 p-2">
            <Users className="h-5 w-5 text-purple-600" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">ทั้งหมด</p>
            <p className="text-2xl font-bold">{stats.total}</p>
          </div>
        </button>
        <button
          onClick={() => setThesisFilter("has")}
          className={`rounded-lg border p-4 flex items-center gap-3 transition-colors text-left ${
            currentThesis === "has" ? "border-green-400 bg-green-50 ring-1 ring-green-400" : "bg-card hover:bg-muted/30"
          }`}
        >
          <div className="rounded-full bg-green-100 p-2">
            <FileText className="h-5 w-5 text-green-600" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">มีหัวข้อวิทยานิพนธ์</p>
            <p className="text-2xl font-bold">{stats.withThesis}</p>
          </div>
        </button>
        <button
          onClick={() => setThesisFilter("none")}
          className={`rounded-lg border p-4 flex items-center gap-3 transition-colors text-left ${
            currentThesis === "none" ? "border-amber-400 bg-amber-50 ring-1 ring-amber-400" : "bg-card hover:bg-muted/30"
          }`}
        >
          <div className="rounded-full bg-amber-100 p-2">
            <FileQuestion className="h-5 w-5 text-amber-600" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">ยังไม่มีหัวข้อ</p>
            <p className="text-2xl font-bold">{stats.withoutThesis}</p>
          </div>
        </button>
      </div>

      {/* Level filter tabs */}
      <div className="flex flex-wrap gap-2">
        {LEVEL_TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setLevelFilter(tab.key)}
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
              currentLevel === tab.key
                ? "bg-primary text-primary-foreground"
                : "bg-muted hover:bg-muted/80 text-muted-foreground"
            }`}
          >
            {tab.key === "" && <Users className="h-3.5 w-3.5" />}
            {tab.key === "ปริญญาโท" && <GraduationCap className="h-3.5 w-3.5" />}
            {tab.key === "ปริญญาเอก" && <GraduationCap className="h-3.5 w-3.5" />}
            {tab.key === "none" && <FileQuestion className="h-3.5 w-3.5" />}
            {tab.label}
            <span className={`text-xs ${currentLevel === tab.key ? "text-primary-foreground/70" : "text-muted-foreground/70"}`}>
              ({levelCounts[tab.key]})
            </span>
          </button>
        ))}
      </div>

      {/* Sync button + search */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <Button
          onClick={handleSync}
          disabled={syncing}
          variant="outline"
          className="rounded gap-2 shrink-0"
        >
          <RefreshCw className={`h-4 w-4 ${syncing ? "animate-spin" : ""}`} />
          {syncing ? "กำลังดึงข้อมูล..." : "ดึงข้อมูลนักศึกษา"}
        </Button>

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
      </div>

      {/* Sync result */}
      {syncResult && (
        <div className="rounded border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
          ดึงข้อมูลสำเร็จ: {syncResult.total} คน (เพิ่มใหม่ {syncResult.created}, อัปเดต {syncResult.updated})
        </div>
      )}
      {syncError && (
        <div className="rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {syncError}
        </div>
      )}

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
                    ระดับ
                  </th>
                  <th className="px-4 py-3 text-left font-heading font-semibold text-xs uppercase tracking-wider text-muted-foreground">
                    ชื่อวิทยานิพนธ์
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
                      {student.level ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-purple-100 text-purple-700 px-2 py-0.5 text-xs font-medium">
                          {student.level}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs max-w-64 truncate">
                      {student.thesisTitleTh || student.thesisTitleEn || "—"}
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
                <div className="flex items-center gap-2 mt-1">
                  <p className="text-xs text-muted-foreground font-mono">
                    {student.studentId}
                  </p>
                  {student.level && (
                    <span className="inline-flex items-center rounded-full bg-purple-100 text-purple-700 px-1.5 py-0.5 text-[10px] font-medium">
                      {student.level}
                    </span>
                  )}
                </div>
                {(student.thesisTitleTh || student.thesisTitleEn) && (
                  <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2">
                    {student.thesisTitleTh || student.thesisTitleEn}
                  </p>
                )}
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
