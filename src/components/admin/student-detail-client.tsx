"use client";

import { useActionState, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { StatusBadge } from "@/components/status-badge";
import {
  approveDocument,
  rejectDocument,
  removeDocument,
  type UploadDocumentState,
} from "@/actions/document-actions";
import type { ThesisData } from "@/lib/auth/cmu-oauth";
import { ArrowLeft, Check, XCircle, Trash2, FileText, Clock, ShieldCheck, AlertTriangle, Download } from "lucide-react";
import { formatDateTime } from "@/lib/utils";

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

type StudentInfo = {
  id: string;
  name: string;
  email: string;
  studentId: string;
};

type DocumentRow = {
  id: string;
  title: string;
  originalName: string;
  status: string;
  adminNotes: string | null;
  reviewedBy: string | null;
  reviewedAt: string | null;
  createdAt: string;
};

type StudentDetailClientProps = {
  student: StudentInfo;
  thesis: ThesisData;
  documents: DocumentRow[];
  page: number;
  hasMore: boolean;
  totalPages: number;
  currentStatus: string;
  totalDocs: number;
  totalPending: number;
  totalApproved: number;
  totalRejected: number;
};

export function StudentDetailClient({
  student,
  thesis,
  documents,
  page,
  hasMore,
  totalPages,
  currentStatus,
  totalDocs,
  totalPending,
  totalApproved,
  totalRejected,
}: StudentDetailClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const basePath = `/admin/students/${encodeURIComponent(student.id)}`;

  const [selected, setSelected] = useState<Set<string>>(new Set());

  const pendingDocs = useMemo(() => documents.filter((d) => d.status === "PENDING"), [documents]);

  function toggleDoc(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    if (selected.size === pendingDocs.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(pendingDocs.map((d) => d.id)));
    }
  }

  function setStatusFilter(status: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (status === "ALL") {
      params.delete("status");
    } else {
      params.set("status", status);
    }
    params.delete("page");
    router.push(`${basePath}?${params.toString()}`);
  }

  const STATUS_CARDS = [
    { value: "ALL", label: "ทั้งหมด", count: totalDocs, icon: <FileText className="h-4 w-4" />, color: "text-blue-600 bg-blue-50" },
    { value: "PENDING", label: "รอตรวจสอบ", count: totalPending, icon: <Clock className="h-4 w-4" />, color: "text-amber-600 bg-amber-50" },
    { value: "APPROVED", label: "อนุมัติแล้ว", count: totalApproved, icon: <ShieldCheck className="h-4 w-4" />, color: "text-green-600 bg-green-50" },
    { value: "REJECTED", label: "ปฏิเสธแล้ว", count: totalRejected, icon: <AlertTriangle className="h-4 w-4" />, color: "text-red-600 bg-red-50" },
  ];

  function goToPage(p: number) {
    const params = new URLSearchParams(searchParams.toString());
    if (p <= 1) {
      params.delete("page");
    } else {
      params.set("page", String(p));
    }
    router.push(`${basePath}?${params.toString()}`);
  }

  const allChecked = pendingDocs.length > 0 && selected.size === pendingDocs.length;

  return (
    <div className="space-y-6">
      {/* Back link — sticky below navbar */}
      <div className="sticky top-14 z-10 -mx-4 px-4 py-2 bg-background/95 backdrop-blur-sm border-b lg:-mx-6 lg:px-6">
        <Link
          href="/admin/students"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          กลับไปรายชื่อนักศึกษา
        </Link>
      </div>

      {/* Student header */}
      <div>
        <h1 className="font-heading text-2xl font-bold tracking-tight heading-accent">
          {student.name}
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          รหัสนักศึกษา <span className="font-mono font-medium">{student.studentId}</span>
        </p>
      </div>

      {/* Profile card */}
      <div className="rounded-lg border bg-card p-5 space-y-3">
        <h2 className="font-heading font-bold tracking-tight text-sm uppercase text-muted-foreground">
          ข้อมูลส่วนตัว
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
          <div>
            <span className="text-muted-foreground">ชื่อ-นามสกุล</span>
            <p className="font-medium">{student.name}</p>
          </div>
          <div>
            <span className="text-muted-foreground">รหัสนักศึกษา</span>
            <p className="font-medium font-mono">{student.studentId}</p>
          </div>
          <div>
            <span className="text-muted-foreground">อีเมล</span>
            <p className="font-medium">{student.email}</p>
          </div>
        </div>
      </div>

      {/* Thesis card */}
      <div className="rounded-lg border bg-card p-5 space-y-3">
        <h2 className="font-heading font-bold tracking-tight text-sm uppercase text-muted-foreground">
          ข้อมูลวิทยานิพนธ์
        </h2>
        {thesis ? (
          <div className="grid grid-cols-1 gap-3 text-sm">
            <div>
              <span className="text-muted-foreground">ชื่อวิทยานิพนธ์ (ไทย)</span>
              <p className="font-medium">{thesis.title_th}</p>
            </div>
            <div>
              <span className="text-muted-foreground">ชื่อวิทยานิพนธ์ (English)</span>
              <p className="font-medium">{thesis.title_en}</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <span className="text-muted-foreground">หลักสูตร</span>
                <p className="font-medium">{thesis.curriculum}</p>
              </div>
              <div>
                <span className="text-muted-foreground">สาขา</span>
                <p className="font-medium">{thesis.major_th}</p>
              </div>
              <div>
                <span className="text-muted-foreground">ระดับ</span>
                <p className="font-medium">{thesis.level_name_th}</p>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">ไม่พบข้อมูลวิทยานิพนธ์</p>
        )}
      </div>

      {/* Documents section */}
      <div className="space-y-4">
        <h2 className="font-heading font-bold tracking-tight text-sm uppercase text-muted-foreground">
          เอกสารเครื่องมือวิจัย
        </h2>

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

        {/* Select all */}
        {pendingDocs.length > 0 && (
          <div className="flex items-center gap-3 px-1">
            <label className="inline-flex items-center gap-2 text-xs text-muted-foreground cursor-pointer select-none">
              <input
                type="checkbox"
                checked={allChecked}
                onChange={toggleAll}
                className="rounded border-muted-foreground/40 accent-primary"
              />
              เลือกทั้งหมดที่รอตรวจ ({pendingDocs.length})
            </label>
            {selected.size > 0 && (
              <span className="text-xs font-medium text-primary">
                เลือกแล้ว {selected.size} รายการ
              </span>
            )}
          </div>
        )}

        {documents.length === 0 ? (
          <div className="rounded-lg border border-dashed p-10 text-center text-muted-foreground">
            ยังไม่มีเอกสาร
          </div>
        ) : (
          <div className="space-y-3">
            {documents.map((doc) => (
              <DocumentCard
                key={doc.id}
                doc={doc}
                selected={selected.has(doc.id)}
                onToggle={() => toggleDoc(doc.id)}
                onDeselect={() => setSelected((prev) => { const next = new Set(prev); next.delete(doc.id); return next; })}
              />
            ))}
          </div>
        )}

        {(page > 1 || hasMore) && (
          <Pagination page={page} totalPages={totalPages} onPageChange={goToPage} />
        )}
      </div>

      {/* Sticky bottom action bar */}
      {selected.size > 0 && (
        <BulkApproveBar selected={selected} onClear={() => setSelected(new Set())} />
      )}
    </div>
  );
}

/* ---------- Bulk approve bar + confirm ---------- */

function BulkApproveBar({ selected, onClear }: { selected: Set<string>; onClear: () => void }) {
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);

  function handleApprove() {
    startTransition(async () => {
      let ok = 0;
      let fail = 0;
      for (const id of selected) {
        const r = await approveDocument(id);
        if (r.error) fail++;
        else ok++;
      }
      if (fail > 0) toast.error(`อนุมัติไม่สำเร็จ ${fail} รายการ`);
      if (ok > 0) toast.success(`อนุมัติสำเร็จ ${ok} รายการ`);
      setOpen(false);
      onClear();
    });
  }

  return (
    <>
      <div className="fixed bottom-0 inset-x-0 z-50 border-t bg-background/95 backdrop-blur shadow-lg">
        <div className="max-w-3xl mx-auto flex items-center justify-between px-4 py-4">
          <span className="text-sm font-medium">
            เลือก <span className="text-primary">{selected.size}</span> รายการ
          </span>
          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClear}
              className="rounded"
            >
              ยกเลิกเลือก
            </Button>
            <Button
              type="button"
              onClick={() => setOpen(true)}
              className="rounded-lg h-11 px-6 text-sm font-semibold"
            >
              <Check className="h-5 w-5 mr-2" />
              อนุมัติที่เลือก ({selected.size})
            </Button>
          </div>
        </div>
      </div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md rounded-lg">
          <DialogHeader>
            <DialogTitle className="font-heading font-bold tracking-tight">
              ยืนยันการอนุมัติ
            </DialogTitle>
            <DialogDescription>
              ต้องการอนุมัติเอกสาร {selected.size} รายการที่เลือกหรือไม่? นักศึกษาจะได้รับแจ้งทางอีเมล
            </DialogDescription>
          </DialogHeader>
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
              onClick={handleApprove}
              disabled={pending}
              className="rounded font-semibold"
            >
              {pending ? "กำลังอนุมัติ..." : `อนุมัติ ${selected.size} รายการ`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

/* ---------- Pagination ---------- */

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

/* ---------- Document card ---------- */

function DocumentCard({ doc, selected, onToggle, onDeselect }: { doc: DocumentRow; selected: boolean; onToggle: () => void; onDeselect: () => void }) {
  const borderColor =
    doc.status === "PENDING"
      ? "border-l-amber-400"
      : doc.status === "APPROVED"
      ? "border-l-green-400"
      : "border-l-red-400";

  const isSelectable = doc.status === "PENDING";

  return (
    <div
      onClick={isSelectable ? onToggle : undefined}
      className={`rounded-lg border bg-card border-l-4 ${borderColor} overflow-hidden transition-colors ${isSelectable ? "cursor-pointer hover:bg-muted/30" : ""} ${selected ? "bg-primary/5 ring-1 ring-primary" : ""}`}
    >
      <div className="p-4 sm:p-5">
        {/* Top row: title + status */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0 flex-1">
            {isSelectable && (
              <div className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 transition-colors ${selected ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground/40"}`}>
                {selected && <Check className="h-3.5 w-3.5" />}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <h3 className="font-medium text-sm sm:text-base wrap-break-word">{doc.title}</h3>
              <div className="flex flex-wrap items-center gap-3 mt-2 text-muted-foreground">
                <a
                  href={`${BASE_PATH}/api/documents/${doc.id}/file`}
                  download
                  onClick={(e) => e.stopPropagation()}
                  className="inline-flex items-center gap-1.5 text-primary hover:underline rounded-md border border-primary/20 hover:bg-primary/5 px-3 py-1.5 text-sm font-medium transition-colors"
                >
                  <FileText className="h-4 w-4" />
                  {doc.originalName}
                </a>
                <span>ยื่นเมื่อ {formatDateTime(doc.createdAt)}</span>
              </div>
            </div>
          </div>
          <div className="shrink-0">
            <StatusBadge status={doc.status} />
          </div>
        </div>

        {/* Approved info */}
        {doc.status === "APPROVED" && doc.reviewedAt && (
          <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground bg-green-50 rounded-md px-3 py-2">
            <ShieldCheck className="h-3.5 w-3.5 text-green-600 shrink-0" />
            <span>
              อนุมัติเมื่อ {formatDateTime(doc.reviewedAt)}
              {doc.reviewedBy && ` โดย ${doc.reviewedBy}`}
            </span>
          </div>
        )}

        {/* Rejected info */}
        {doc.status === "REJECTED" && doc.adminNotes && (
          <div className="mt-3 flex items-start gap-2 text-xs bg-red-50 text-red-700 rounded-md px-3 py-2">
            <XCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
            <span>เหตุผล: {doc.adminNotes}</span>
          </div>
        )}

        {/* Actions */}
        <div className="mt-4 flex flex-wrap items-center gap-2 pt-3 border-t" onClick={(e) => e.stopPropagation()}>
          {doc.status === "PENDING" && (
            <>
              <RejectButton documentId={doc.id} onDone={onDeselect} />
              <div className="flex-1" />
              <RemoveButton documentId={doc.id} onDone={onDeselect} />
            </>
          )}
          {doc.status === "APPROVED" && (
            <>
              <a
                href={`${BASE_PATH}/api/documents/${doc.id}/certificate`}
                download
                className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline h-8 px-3 rounded-md border border-primary/20 hover:bg-primary/5 transition-colors"
              >
                <Download className="h-3.5 w-3.5" />
                ใบรับรอง
              </a>
              <div className="flex-1" />
              <RemoveButton documentId={doc.id} />
            </>
          )}
          {doc.status === "REJECTED" && (
            <>
              <div className="flex-1" />
              <RemoveButton documentId={doc.id} />
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* ---------- Reject ---------- */

function RejectButton({ documentId, onDone }: { documentId: string; onDone?: () => void }) {
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
        onDone?.();
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
        className="rounded-md h-8 text-xs"
      >
        <XCircle className="h-3.5 w-3.5 mr-1" />
        ปฏิเสธ
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md rounded-lg">
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
            className="rounded-md min-h-24"
          />
          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={pending}
              className="rounded-md"
            >
              ยกเลิก
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleReject}
              disabled={pending || !notes.trim()}
              className="rounded-md font-semibold"
            >
              {pending ? "กำลังบันทึก..." : "ปฏิเสธ"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

/* ---------- Remove ---------- */

function RemoveButton({ documentId, onDone }: { documentId: string; onDone?: () => void }) {
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
      onDone?.();
    }
    if (!state.success) prevSuccessRef.current = false;
  }, [state.success, onDone]);

  if (state.success && open) setOpen(false);

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => setOpen(true)}
        className="text-destructive hover:text-destructive rounded-md h-8 text-xs"
      >
        <Trash2 className="h-3.5 w-3.5 mr-1" />
        ลบ
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md rounded-lg">
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
              className="rounded-md"
            >
              ยกเลิก
            </Button>
            <form action={formAction}>
              <input type="hidden" name="documentId" value={documentId} />
              <Button
                type="submit"
                disabled={pending}
                variant="destructive"
                className="rounded-md font-semibold"
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
