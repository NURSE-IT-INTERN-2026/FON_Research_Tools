"use client";

import { useActionState, useEffect, useRef, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  approveBorrowing,
  rejectBorrowing,
  type BorrowingActionState,
} from "@/actions/borrowing-actions";
import { StatusBadge } from "@/components/status-badge";
import { CheckCircle, XCircle, Check, Search, X, FileText, Clock, AlertTriangle, ChevronLeft, ChevronRight } from "lucide-react";
import { formatDateTime } from "@/lib/utils";

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

type BorrowRecord = {
  id: string;
  instrumentName: string;
  studentName: string;
  studentId: string;
  requesterName: string | null;
  requestDate: string | null;
  additionalDetails: string | null;
  licenseOriginalName: string | null;
  status: string;
  adminNotes: string | null;
  createdAt: string;
  reviewedAt: string | null;
  reviewedBy: string | null;
};

const STATUS_BORDER: Record<string, string> = {
  PENDING: "border-l-amber-500",
  APPROVED: "border-l-green-500",
  REJECTED: "border-l-red-500",
};

export function BorrowingClient({
  records,
  currentStatus,
  currentQuery,
  page,
  hasMore,
  totalPages,
  counts,
}: {
  records: BorrowRecord[];
  currentStatus: string;
  currentQuery: string;
  page: number;
  hasMore: boolean;
  totalPages: number;
  counts: { all: number; pending: number; approved: number; rejected: number };
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchInput, setSearchInput] = useState(currentQuery);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

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
      router.push(`/admin/borrowing?${params.toString()}`);
    }, 500);
  }, [searchParams, router]);

  useEffect(() => {
    if (document.activeElement !== searchInputRef.current) {
      setSearchInput(currentQuery);
    }
  }, [currentQuery]);

  function clearSearch() {
    setSearchInput("");
    if (timerRef.current) clearTimeout(timerRef.current);
    const params = new URLSearchParams(searchParams.toString());
    params.delete("q");
    params.delete("page");
    router.push(`/admin/borrowing?${params.toString()}`);
  }

  function setStatusFilter(status: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (status === "ALL") {
      params.delete("status");
    } else {
      params.set("status", status);
    }
    params.delete("page");
    router.push(`/admin/borrowing?${params.toString()}`);
  }

  function goToPage(p: number) {
    const params = new URLSearchParams(searchParams.toString());
    if (p <= 1) {
      params.delete("page");
    } else {
      params.set("page", String(p));
    }
    router.push(`/admin/borrowing?${params.toString()}`);
  }

  const STATUS_CARDS = [
    { value: "ALL", label: "ทั้งหมด", count: counts.all, icon: <FileText className="h-4 w-4" />, color: "text-blue-600 bg-blue-50" },
    { value: "PENDING", label: "รอตรวจสอบ", count: counts.pending, icon: <Clock className="h-4 w-4" />, color: "text-amber-600 bg-amber-50" },
    { value: "APPROVED", label: "อนุมัติแล้ว", count: counts.approved, icon: <CheckCircle className="h-4 w-4" />, color: "text-green-600 bg-green-50" },
    { value: "REJECTED", label: "ปฏิเสธแล้ว", count: counts.rejected, icon: <AlertTriangle className="h-4 w-4" />, color: "text-red-600 bg-red-50" },
  ];

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative w-full max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          ref={searchInputRef}
          value={searchInput}
          onChange={(e) => {
            setSearchInput(e.target.value);
            updateSearch(e.target.value);
          }}
          placeholder="ค้นหาจากชื่อเครื่องมือ, ชื่อนักศึกษา, รหัสนักศึกษา..."
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

      {/* Status filter cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {STATUS_CARDS.map((card) => (
          <button
            key={card.value}
            type="button"
            onClick={() => setStatusFilter(card.value)}
            className={`rounded-lg border p-3 flex items-center gap-3 transition-colors ${card.color} ${currentStatus === card.value ? "ring-2 ring-primary ring-offset-1" : "opacity-70 hover:opacity-100"}`}
          >
            <div className="shrink-0">{card.icon}</div>
            <div className="text-left">
              <p className="text-xl font-bold leading-none">{card.count}</p>
              <p className="text-xs mt-0.5 opacity-80">{card.label}</p>
            </div>
          </button>
        ))}
      </div>

      {/* Table */}
      {records.length === 0 ? (
        <div className="rounded border border-dashed p-10 text-center text-muted-foreground">
          ไม่พบคำขอยืม
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto rounded border bg-card">
            <table className="w-full min-w-140 text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-3 text-left font-heading font-semibold text-xs uppercase tracking-wider text-muted-foreground">
                    ลำดับ
                  </th>
                  <th className="px-4 py-3 text-left font-heading font-semibold text-xs uppercase tracking-wider text-muted-foreground">
                    นักศึกษา
                  </th>
                  <th className="px-4 py-3 text-left font-heading font-semibold text-xs uppercase tracking-wider text-muted-foreground">
                    เครื่องมือวิจัย
                  </th>
                  <th className="px-4 py-3 text-left font-heading font-semibold text-xs uppercase tracking-wider text-muted-foreground">
                    ใบอนุญาต
                  </th>
                  <th className="px-4 py-3 text-left font-heading font-semibold text-xs uppercase tracking-wider text-muted-foreground">
                    สถานะ
                  </th>
                  <th className="px-4 py-3 text-left font-heading font-semibold text-xs uppercase tracking-wider text-muted-foreground">
                    วันที่ดำเนินการ
                  </th>
                  <th className="px-4 py-3 text-left font-heading font-semibold text-xs uppercase tracking-wider text-muted-foreground">
                    วันที่ยื่น
                  </th>
                  <th className="px-4 py-3 text-left font-heading font-semibold text-xs uppercase tracking-wider text-muted-foreground">
                    ผู้ดำเนินการ
                  </th>
                  <th className="px-3 py-3 text-center font-heading font-semibold text-xs uppercase tracking-wider text-muted-foreground">
                    ดำเนินการ
                  </th>
                </tr>
              </thead>
              <tbody>
                {records.map((rec, i) => (
                  <tr
                    key={rec.id}
                    className="border-t transition-colors hover:bg-muted/30"
                  >
                    <td className="px-4 py-3 text-muted-foreground">
                      {(page - 1) * 10 + i + 1}
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium">{rec.studentName}</p>
                      <p className="text-xs text-muted-foreground font-mono">{rec.studentId}</p>
                    </td>
                    <td className="px-4 py-3 font-medium">{rec.instrumentName}</td>
                    <td className="px-3 py-3 text-center">
                      {rec.licenseOriginalName ? (
                        <a
                          href={`${BASE_PATH}/api/borrowing/${rec.id}/license`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-center rounded-md h-8 w-8 hover:bg-muted transition-colors"
                          title={rec.licenseOriginalName}
                        >
                          <FileText className="h-4 w-4 text-muted-foreground hover:text-primary" />
                        </a>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={rec.status} />
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">
                      {rec.reviewedAt ? formatDateTime(rec.reviewedAt) : "—"}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">
                      {formatDateTime(rec.createdAt)}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">
                      {rec.reviewedBy ?? "—"}
                    </td>
                    <td className="px-3 py-3">
                      {rec.status === "PENDING" && (
                        <div className="flex items-center justify-center gap-1">
                          <ApproveButton recordId={rec.id} />
                          <RejectButton recordId={rec.id} />
                        </div>
                      )}
                      {rec.status === "REJECTED" && rec.adminNotes && (
                        <span
                          className="text-xs text-destructive line-clamp-2"
                          title={rec.adminNotes}
                        >
                          {rec.adminNotes}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {records.map((rec) => (
              <div key={rec.id} className={`rounded border bg-card border-l-4 ${STATUS_BORDER[rec.status] ?? ""} p-4 space-y-3`}>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-medium text-sm">{rec.instrumentName}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-primary">{rec.studentName}</span>
                      <span className="text-xs text-muted-foreground font-mono">{rec.studentId}</span>
                    </div>
                  </div>
                  <StatusBadge status={rec.status} />
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                  <div>
                    <span className="text-muted-foreground">วันที่ดำเนินการ</span>
                    <p>{rec.reviewedAt ? formatDateTime(rec.reviewedAt) : "—"}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">วันที่ยื่น</span>
                    <p>{formatDateTime(rec.createdAt)}</p>
                  </div>
                  {rec.reviewedBy && (
                    <div>
                      <span className="text-muted-foreground">ผู้ดำเนินการ</span>
                      <p>{rec.reviewedBy}</p>
                    </div>
                  )}
                </div>
                {rec.licenseOriginalName && (
                  <a
                    href={`${BASE_PATH}/api/borrowing/${rec.id}/license`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-primary hover:underline text-xs"
                  >
                    <FileText className="h-3.5 w-3.5 shrink-0" />
                    เปิดใบอนุญาต
                  </a>
                )}
                {rec.status === "REJECTED" && rec.adminNotes && (
                  <p className="text-xs text-destructive">เหตุผล: {rec.adminNotes}</p>
                )}
                {rec.status === "PENDING" && (
                  <div className="flex gap-2 pt-1">
                    <ApproveButton recordId={rec.id} />
                    <RejectButton recordId={rec.id} />
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Pagination */}
          {(page > 1 || hasMore) && (
            <div className="flex items-center justify-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => goToPage(page - 1)}
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
                onClick={() => goToPage(page + 1)}
                className="rounded text-xs"
              >
                ถัดไป
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function ApproveButton({ recordId }: { recordId: string }) {
  const [state, formAction, pending] = useActionState(
    async (_prev: BorrowingActionState, formData: FormData) => {
      const id = formData.get("recordId") as string;
      return approveBorrowing(id);
    },
    {} as BorrowingActionState,
  );
  const prevSuccessRef = useRef(false);

  useEffect(() => {
    if (state.error) toast.error(state.error);
  }, [state.error]);

  useEffect(() => {
    if (state.success && !prevSuccessRef.current) {
      prevSuccessRef.current = true;
      toast.success("อนุมัติคำขอยืมแล้ว");
    }
    if (!state.success) prevSuccessRef.current = false;
  }, [state.success]);

  return (
    <form action={formAction}>
      <input type="hidden" name="recordId" value={recordId} />
      <button
        type="submit"
        disabled={pending}
        title="อนุมัติ"
        className="inline-flex items-center justify-center rounded-md h-7 w-7 text-green-600 hover:bg-green-50 transition-colors"
      >
        <Check className="h-4 w-4" />
      </button>
    </form>
  );
}

function RejectButton({ recordId }: { recordId: string }) {
  const [open, setOpen] = useState(false);
  const [notes, setNotes] = useState("");
  const [state, formAction, pending] = useActionState(
    async (_prev: BorrowingActionState, formData: FormData) => {
      const id = formData.get("recordId") as string;
      const n = formData.get("notes") as string;
      return rejectBorrowing(id, n);
    },
    {} as BorrowingActionState,
  );
  const prevSuccessRef = useRef(false);

  useEffect(() => {
    if (state.error) toast.error(state.error);
  }, [state.error]);

  useEffect(() => {
    if (state.success && !prevSuccessRef.current) {
      prevSuccessRef.current = true;
      toast.success("ปฏิเสธคำขอยืมแล้ว");
      setOpen(false);
      setNotes("");
    }
    if (!state.success) prevSuccessRef.current = false;
  }, [state.success]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        title="ปฏิเสธ"
        className="inline-flex items-center justify-center rounded-md h-7 w-7 text-amber-600 hover:bg-amber-50 transition-colors"
      >
        <XCircle className="h-4 w-4" />
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md rounded">
          <DialogHeader>
            <DialogTitle className="font-heading font-bold tracking-tight">
              ปฏิเสธคำขอยืม
            </DialogTitle>
            <DialogDescription>
              ระบุเหตุผลในการปฏิเสธ
            </DialogDescription>
          </DialogHeader>
          <form action={formAction}>
            <input type="hidden" name="recordId" value={recordId} />
            <Textarea
              name="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="เหตุผลในการปฏิเสธ"
              className="rounded min-h-24"
            />
            <DialogFooter className="gap-2 mt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={pending}
                className="rounded"
              >
                ยกเลิก
              </Button>
              <Button
                type="submit"
                disabled={pending || !notes.trim()}
                variant="destructive"
                className="rounded font-semibold"
              >
                {pending ? "กำลังบันทึก..." : "ปฏิเสธ"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
