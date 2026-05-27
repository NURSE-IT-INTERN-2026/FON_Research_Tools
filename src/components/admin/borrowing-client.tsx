"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  approveBorrowing,
  rejectBorrowing,
  type BorrowingActionState,
} from "@/actions/borrowing-actions";
import { StatusBadge } from "@/components/status-badge";
import { Check, X, FileText, ChevronLeft, ChevronRight } from "lucide-react";
import { formatDateTime } from "@/lib/utils";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

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
};

const STATUS_OPTIONS = [
  { value: "ALL", label: "ทั้งหมด" },
  { value: "PENDING", label: "รอตรวจสอบ" },
  { value: "APPROVED", label: "อนุมัติแล้ว" },
  { value: "REJECTED", label: "ปฏิเสธแล้ว" },
];

export function BorrowingClient({
  records,
  currentStatus,
  page,
  hasMore,
  totalPages,
  counts,
}: {
  records: BorrowRecord[];
  currentStatus: string;
  page: number;
  hasMore: boolean;
  totalPages: number;
  counts: { all: number; pending: number; approved: number; rejected: number };
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function setFilter(status: string) {
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
    params.set("page", String(p));
    router.push(`/admin/borrowing?${params.toString()}`);
  }

  return (
    <div className="space-y-4">
      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "รอตรวจสอบ", count: counts.pending, value: "PENDING", color: "text-amber-600" },
          { label: "อนุมัติแล้ว", count: counts.approved, value: "APPROVED", color: "text-green-600" },
          { label: "ปฏิเสธแล้ว", count: counts.rejected, value: "REJECTED", color: "text-red-600" },
          { label: "ทั้งหมด", count: counts.all, value: "ALL", color: "text-blue-600" },
        ].map((card) => (
          <button
            key={card.value}
            onClick={() => setFilter(card.value)}
            className={`rounded-xl border bg-card p-4 text-left hover:shadow-md transition-shadow ${
              currentStatus === card.value ? "ring-2 ring-primary" : ""
            }`}
          >
            <p className={`text-2xl font-bold ${card.color}`}>{card.count}</p>
            <p className="text-xs text-muted-foreground mt-1">{card.label}</p>
          </button>
        ))}
      </div>

      {/* Status filter pills */}
      <div className="flex flex-wrap gap-2">
        {STATUS_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setFilter(opt.value)}
            className={`rounded-full px-3 py-1 text-xs border transition-colors ${
              currentStatus === opt.value
                ? "bg-primary text-primary-foreground border-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Records table */}
      {records.length === 0 ? (
        <div className="rounded border border-dashed p-8 text-center text-muted-foreground text-sm">
          ไม่มีคำขอยืม
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full min-w-120 text-sm">
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
                    ชื่อผู้ขอ
                  </th>
                  <th className="px-4 py-3 text-left font-heading font-semibold text-xs uppercase tracking-wider text-muted-foreground">
                    วันที่ขอ
                  </th>
                  <th className="px-4 py-3 text-left font-heading font-semibold text-xs uppercase tracking-wider text-muted-foreground">
                    ใบอนุญาต
                  </th>
                  <th className="px-4 py-3 text-left font-heading font-semibold text-xs uppercase tracking-wider text-muted-foreground">
                    สถานะ
                  </th>
                  <th className="px-4 py-3 text-left font-heading font-semibold text-xs uppercase tracking-wider text-muted-foreground">
                    วันที่ยื่น
                  </th>
                  <th className="px-4 py-3 text-left font-heading font-semibold text-xs uppercase tracking-wider text-muted-foreground">
                    การดำเนินการ
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
                      {(page - 1) * 20 + i + 1}
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium">{rec.studentName}</p>
                      <p className="text-xs text-muted-foreground">{rec.studentId}</p>
                    </td>
                    <td className="px-4 py-3 font-medium">{rec.instrumentName}</td>
                    <td className="px-4 py-3">{rec.requesterName ?? "—"}</td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">
                      {rec.requestDate
                        ? new Date(rec.requestDate).toLocaleDateString("th-TH")
                        : "—"}
                    </td>
                    <td className="px-4 py-3">
                      {rec.licenseOriginalName ? (
                        <a
                          href={`${basePath}/api/borrowing/${rec.id}/license`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-primary hover:underline text-xs"
                        >
                          <FileText className="h-3.5 w-3.5" />
                          เปิดไฟล์
                        </a>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={rec.status} />
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">
                      {formatDateTime(rec.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      {rec.status === "PENDING" && (
                        <div className="flex items-center gap-1">
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
              <div key={rec.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-sm truncate">{rec.instrumentName}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {rec.studentName} ({rec.studentId})
                    </p>
                  </div>
                  <StatusBadge status={rec.status} />
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                  <div>
                    <span className="text-muted-foreground">ชื่อผู้ขอ</span>
                    <p>{rec.requesterName ?? "—"}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">วันที่ขอ</span>
                    <p>
                      {rec.requestDate
                        ? new Date(rec.requestDate).toLocaleDateString("th-TH")
                        : "—"}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">วันที่ยื่น</span>
                    <p>{formatDateTime(rec.createdAt)}</p>
                  </div>
                </div>
                {rec.licenseOriginalName && (
                  <a
                    href={`${basePath}/api/borrowing/${rec.id}/license`}
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
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => goToPage(page - 1)}
                className="rounded"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm text-muted-foreground">
                หน้า {page} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={!hasMore}
                onClick={() => goToPage(page + 1)}
                className="rounded"
              >
                <ChevronRight className="h-4 w-4" />
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
      <Button
        type="submit"
        size="sm"
        disabled={pending}
        className="rounded font-semibold h-8"
      >
        <Check className="h-3.5 w-3.5 mr-1" />
        {pending ? "..." : "อนุมัติ"}
      </Button>
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
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        className="rounded h-8"
      >
        <X className="h-3.5 w-3.5 mr-1" />
        ปฏิเสธ
      </Button>
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
              className="rounded mt-2"
              rows={3}
            />
            <DialogFooter className="gap-2 mt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
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
                {pending ? "กำลังปฏิเสธ..." : "ปฏิเสธ"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
