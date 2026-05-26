"use client";

import { Suspense, useActionState, useState, useEffect, useRef, useTransition, useCallback } from "react";
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
import { FilterPills } from "@/components/filter-pills";
import { StatusBadge } from "@/components/status-badge";
import {
  approveDocument,
  approveAllStudentPending,
  rejectDocument,
  removeDocument,
  type UploadDocumentState,
} from "@/actions/document-actions";
import { CheckCircle, XCircle, Trash2, Check, Search, X } from "lucide-react";
import { formatDateTime } from "@/lib/utils";

type DocumentRow = {
  id: string;
  userId: string;
  title: string;
  originalName: string;
  studentName: string;
  studentId: string;
  status: string;
  createdAt: string;
  approvedAt: string | null;
};

type DocumentsClientProps = {
  documents: DocumentRow[];
  currentStatus: string;
  currentQuery: string;
  page: number;
  hasMore: boolean;
};

const STATUS_OPTIONS = [
  { label: "ทั้งหมด", value: "ALL" },
  { label: "รอตรวจสอบ", value: "PENDING" },
  { label: "อนุมัติแล้ว", value: "APPROVED" },
  { label: "ปฏิเสธแล้ว", value: "REJECTED" },
];

export function DocumentsClient({
  documents,
  currentStatus,
  currentQuery,
  page,
  hasMore,
}: DocumentsClientProps) {
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
      router.push(`/admin/documents?${params.toString()}`);
    }, 300);
  }, [searchParams, router]);

  function clearSearch() {
    setSearchInput("");
    if (timerRef.current) clearTimeout(timerRef.current);
    const params = new URLSearchParams(searchParams.toString());
    params.delete("q");
    params.delete("page");
    router.push(`/admin/documents?${params.toString()}`);
  }

  function goToPage(p: number) {
    const params = new URLSearchParams(searchParams.toString());
    if (p <= 1) {
      params.delete("page");
    } else {
      params.set("page", String(p));
    }
    router.push(`/admin/documents?${params.toString()}`);
  }

  return (
    <div className="space-y-4">
      {/* Toolbar: search + filter */}
      <div className="space-y-3">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
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
        <div className="flex flex-wrap items-center gap-3">
          <Suspense>
            <FilterPills
              paramName="status"
              options={STATUS_OPTIONS}
              selected={currentStatus}
              basePath="/admin/documents"
              resetParams={["page"]}
            />
          </Suspense>
        </div>
      </div>

      {/* Table */}
      {documents.length === 0 ? (
        <div className="rounded border border-dashed p-10 text-center text-muted-foreground">
          ไม่พบเอกสาร
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
                    ชื่อนักศึกษา
                  </th>
                  <th className="px-4 py-3 text-left font-heading font-semibold text-xs uppercase tracking-wider text-muted-foreground">
                    รหัสนักศึกษา
                  </th>
                  <th className="px-4 py-3 text-left font-heading font-semibold text-xs uppercase tracking-wider text-muted-foreground">
                    ชื่อเครื่องมือวิจัย
                  </th>
                  <th className="px-4 py-3 text-left font-heading font-semibold text-xs uppercase tracking-wider text-muted-foreground">
                    สถานะ
                  </th>
                  <th className="px-4 py-3 text-left font-heading font-semibold text-xs uppercase tracking-wider text-muted-foreground">
                    วันที่อัปโหลด
                  </th>
                  <th className="px-4 py-3 text-left font-heading font-semibold text-xs uppercase tracking-wider text-muted-foreground">
                    วันที่อนุมัติ
                  </th>
                  <th className="px-4 py-3 text-left font-heading font-semibold text-xs uppercase tracking-wider text-muted-foreground">
                    การดำเนินการ
                  </th>
                </tr>
              </thead>
              <tbody>
                {documents.map((doc, i) => (
                  <tr
                    key={doc.id}
                    className="border-t transition-colors hover:bg-muted/30"
                  >
                    <td className="px-4 py-3 text-muted-foreground">
                      {(page - 1) * 10 + i + 1}
                    </td>
                    <td className="px-4 py-3 font-medium">
                      <Link
                        href={`/admin/students/${doc.userId}`}
                        className="text-primary hover:underline"
                      >
                        {doc.studentName}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground font-mono text-xs">
                      {doc.studentId}
                    </td>
                    <td className="px-4 py-3">{doc.title}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={doc.status} />
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">
                      {formatDateTime(doc.createdAt)}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">
                      {doc.approvedAt ? formatDateTime(doc.approvedAt) : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <ActionButtons doc={doc} documents={documents} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {documents.map((doc) => (
              <DocumentCard key={doc.id} doc={doc} documents={documents} />
            ))}
          </div>
        </>
      )}

      {/* Pagination */}
      {(page > 1 || hasMore) && (
        <Pagination
          page={page}
          hasMore={hasMore}
          onPageChange={goToPage}
        />
      )}
    </div>
  );
}

function ActionButtons({ doc, documents }: { doc: DocumentRow; documents: DocumentRow[] }) {
  if (doc.status === "PENDING") {
    const studentPendingCount = documents.filter(
      (d) => d.userId === doc.userId && d.status === "PENDING",
    ).length;
    return (
      <div className="flex items-center gap-1.5">
        <ApproveButton documentId={doc.id} />
        {studentPendingCount > 1 && (
          <ApproveAllStudentButton userId={doc.userId} studentName={doc.studentName} />
        )}
        <RejectButton documentId={doc.id} />
        <RemoveButton documentId={doc.id} />
      </div>
    );
  }
  return <RemoveButton documentId={doc.id} />;
}

function ApproveButton({ documentId }: { documentId: string }) {
  const [pending, startTransition] = useTransition();

  function handleApprove() {
    startTransition(async () => {
      const result = await approveDocument(documentId);
      if (result.error) toast.error(result.error);
      else toast.success("อนุมัติเอกสารสำเร็จ");
    });
  }

  return (
    <Button
      type="button"
      size="sm"
      onClick={handleApprove}
      disabled={pending}
      className="rounded h-8 text-xs"
    >
      <Check className="h-3.5 w-3.5 mr-1" />
      {pending ? "..." : "อนุมัติ"}
    </Button>
  );
}

function RejectButton({ documentId }: { documentId: string }) {
  const [open, setOpen] = useState(false);
  const [notes, setNotes] = useState("");
  const [pending, startTransition] = useTransition();

  function handleReject() {
    if (!notes.trim()) {
      toast.error("กรุณาระบุเหตุผล");
      return;
    }
    startTransition(async () => {
      const result = await rejectDocument(documentId, notes.trim());
      if (result.error) toast.error(result.error);
      else {
        toast.success("ปฏิเสธเอกสารสำเร็จ");
        setOpen(false);
        setNotes("");
      }
    });
  }

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        className="rounded h-8 text-xs"
      >
        <XCircle className="h-3.5 w-3.5 mr-1" />
        ปฏิเสธ
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md rounded">
          <DialogHeader>
            <DialogTitle className="font-heading font-bold tracking-tight">
              ปฏิเสธเอกสาร
            </DialogTitle>
            <DialogDescription>
              ระบุเหตุผลในการปฏิเสธเอกสารนี้ นักศึกษาจะได้รับแจ้งทางอีเมล
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="หมายเหตุ/เหตุผล..."
            className="rounded min-h-24"
          />
          <DialogFooter className="gap-2">
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
              type="button"
              variant="destructive"
              onClick={handleReject}
              disabled={pending}
              className="rounded font-semibold"
            >
              {pending ? "กำลังบันทึก..." : "ปฏิเสธ"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function RemoveButton({ documentId }: { documentId: string }) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(
    removeDocument,
    {} as UploadDocumentState,
  );
  const prevSuccessRef = useRef(false);

  useEffect(() => {
    if (state.error) toast.error(state.error);
  }, [state.error]);

  useEffect(() => {
    if (state.success && !prevSuccessRef.current) {
      prevSuccessRef.current = true;
      toast.success("ลบเอกสารสำเร็จ");
    }
    if (!state.success) prevSuccessRef.current = false;
  }, [state.success]);

  if (state.success && open) setOpen(false);

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => setOpen(true)}
        className="text-destructive hover:text-destructive rounded h-8 text-xs"
      >
        <Trash2 className="h-3.5 w-3.5 mr-1" />
        ลบ
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md rounded">
          <DialogHeader>
            <DialogTitle className="font-heading font-bold tracking-tight">
              ยืนยันการลบ
            </DialogTitle>
            <DialogDescription>
              ต้องการลบเอกสารนี้หรือไม่? การกระทำนี้ไม่สามารถย้อนกลับได้
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              className="rounded"
            >
              ยกเลิก
            </Button>
            <form action={formAction}>
              <input type="hidden" name="documentId" value={documentId} />
              <Button
                type="submit"
                disabled={pending}
                variant="destructive"
                className="rounded font-semibold"
              >
                {pending ? "กำลังลบ..." : "ลบ"}
              </Button>
            </form>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function ApproveAllStudentButton({ userId, studentName }: { userId: string; studentName: string }) {
  const [pending, startTransition] = useTransition();

  function handleApproveAll() {
    startTransition(async () => {
      const result = await approveAllStudentPending(userId);
      if (result.error) toast.error(result.error);
      else toast.success(`อนุมัติเอกสาร ${studentName} ทั้งหมดสำเร็จ (${result.count} รายการ)`);
    });
  }

  return (
    <Button
      type="button"
      variant="secondary"
      size="sm"
      onClick={handleApproveAll}
      disabled={pending}
      className="rounded h-8 text-xs"
    >
      <CheckCircle className="h-3.5 w-3.5 mr-1" />
      {pending ? "..." : "อนุมัติทั้งหมด"}
    </Button>
  );
}

const STATUS_BORDER: Record<string, string> = {
  PENDING: "border-l-amber-500",
  APPROVED: "border-l-green-500",
  REJECTED: "border-l-red-500",
};

function DocumentCard({ doc, documents }: { doc: DocumentRow; documents: DocumentRow[] }) {
  return (
    <div className={`rounded border bg-card border-l-4 ${STATUS_BORDER[doc.status] ?? ""} p-4 space-y-3`}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-medium text-sm leading-snug">{doc.title}</p>
          <div className="flex items-center gap-2 mt-1">
            <Link
              href={`/admin/students/${doc.userId}`}
              className="text-xs text-primary hover:underline"
            >
              {doc.studentName}
            </Link>
            <span className="text-xs text-muted-foreground font-mono">{doc.studentId}</span>
          </div>
        </div>
        <StatusBadge status={doc.status} />
      </div>
      <div className="flex flex-col gap-0.5 text-xs text-muted-foreground">
        <span>อัปโหลด: {formatDateTime(doc.createdAt)}</span>
        {doc.approvedAt && <span>อนุมัติ: {formatDateTime(doc.approvedAt)}</span>}
      </div>
      <ActionButtons doc={doc} documents={documents} />
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