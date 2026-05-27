"use client";

import { Fragment, useActionState, useState, useEffect, useRef, useTransition, useCallback, useMemo } from "react";
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
import { StatusBadge } from "@/components/status-badge";
import {
  approveDocument,
  approveAllStudentPending,
  rejectDocument,
  removeDocument,
  type UploadDocumentState,
} from "@/actions/document-actions";
import { CheckCircle, XCircle, Trash2, Check, Search, X, ChevronDown, ChevronUp, BookOpen, Download, FileText, Clock, AlertTriangle } from "lucide-react";
import { formatDateTime } from "@/lib/utils";
import { ExportDropdown } from "./export-dropdown";

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

type DocumentRow = {
  id: string;
  userId: string;
  title: string;
  originalName: string;
  studentName: string;
  studentId: string;
  thesisTitleTh: string | null;
  thesisTitleEn: string | null;
  status: string;
  createdAt: string;
  reviewedAt: string | null;
  reviewedBy: string | null;
};

type DocumentsClientProps = {
  documents: DocumentRow[];
  currentStatus: string;
  currentQuery: string;
  page: number;
  hasMore: boolean;
  totalPages: number;
  counts: { all: number; pending: number; approved: number; rejected: number };
};

export function DocumentsClient({
  documents,
  currentStatus,
  currentQuery,
  page,
  hasMore,
  totalPages,
  counts,
}: DocumentsClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchInput, setSearchInput] = useState(currentQuery);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [expandedStudents, setExpandedStudents] = useState<Set<string>>(new Set());

  const studentGroups = useMemo(() => {
    const map = new Map<string, DocumentRow[]>();
    for (const doc of documents) {
      const arr = map.get(doc.userId) ?? [];
      arr.push(doc);
      map.set(doc.userId, arr);
    }
    return Array.from(map.entries())
      .map(([userId, docs]) => ({ userId, docs }))
      .sort((a, b) => new Date(b.docs[0].createdAt).getTime() - new Date(a.docs[0].createdAt).getTime());
  }, [documents]);

  function toggleStudent(userId: string) {
    setExpandedStudents((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return next;
    });
  }

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

  function setStatusFilter(status: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (status === "ALL") {
      params.delete("status");
    } else {
      params.set("status", status);
    }
    params.delete("page");
    router.push(`/admin/documents?${params.toString()}`);
  }

  const STATUS_CARDS = [
    { value: "ALL", label: "ทั้งหมด", count: counts.all, icon: <FileText className="h-4 w-4" />, color: "text-blue-600 bg-blue-50" },
    { value: "PENDING", label: "รอตรวจสอบ", count: counts.pending, icon: <Clock className="h-4 w-4" />, color: "text-amber-600 bg-amber-50" },
    { value: "APPROVED", label: "อนุมัติแล้ว", count: counts.approved, icon: <CheckCircle className="h-4 w-4" />, color: "text-green-600 bg-green-50" },
    { value: "REJECTED", label: "ปฏิเสธแล้ว", count: counts.rejected, icon: <AlertTriangle className="h-4 w-4" />, color: "text-red-600 bg-red-50" },
  ];

  return (
    <div className="space-y-4">
      {/* Search + Export */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
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
      <ExportDropdown status={currentStatus} query={currentQuery} />
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
                  <th className="px-3 py-3 text-center font-heading font-semibold text-xs uppercase tracking-wider text-muted-foreground">
                    ไฟล์
                  </th>
                  <th className="px-4 py-3 text-left font-heading font-semibold text-xs uppercase tracking-wider text-muted-foreground">
                    สถานะ
                  </th>
                  <th className="px-4 py-3 text-left font-heading font-semibold text-xs uppercase tracking-wider text-muted-foreground">
                    วันที่อัปโหลด
                  </th>
                  <th className="px-4 py-3 text-left font-heading font-semibold text-xs uppercase tracking-wider text-muted-foreground">
                    วันที่ดำเนินการ
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
                {studentGroups.map(({ userId, docs }) => {
                  const first = docs[0];
                  const rest = docs.slice(1);
                  const isExpanded = expandedStudents.has(userId);
                  const firstIdx = documents.indexOf(first);

                  return (
                    <Fragment key={userId}>
                      <tr className="border-t transition-colors hover:bg-muted/30">
                        <td className="px-4 py-3 text-muted-foreground">
                          {(page - 1) * 10 + firstIdx + 1}
                        </td>
                        <td className="px-4 py-3 font-medium">
                          <Link
                            href={`/admin/students/${userId}`}
                            className="text-primary hover:underline"
                          >
                            {first.studentName}
                          </Link>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground font-mono text-xs">
                          {first.studentId}
                        </td>
                        <td className="px-4 py-3">{first.title}</td>
                        <td className="px-3 py-3 text-center">
                          <a href={`${BASE_PATH}/api/documents/${first.id}/file`} download title={first.originalName} className="inline-flex items-center justify-center rounded-md h-8 w-8 hover:bg-muted transition-colors">
                            <Download className="h-4 w-4 text-muted-foreground hover:text-primary" />
                          </a>
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge status={first.status} />
                        </td>
                        <td className="px-4 py-3 text-muted-foreground text-xs">
                          {formatDateTime(first.createdAt)}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground text-xs">
                          {first.reviewedAt ? formatDateTime(first.reviewedAt) : "—"}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground text-xs">
                          {first.reviewedBy ?? "—"}
                        </td>
                        <td className="px-3 py-3">
                          <ActionButtons doc={first} documents={documents} />
                        </td>
                      </tr>
                      {rest.length > 0 && (
                        <tr className="border-t bg-muted/20">
                          <td colSpan={10} className="px-4 py-1.5">
                            <button
                              type="button"
                              onClick={() => toggleStudent(userId)}
                              className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                            >
                              {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                              มีอีก {rest.length} ไฟล์
                            </button>
                          </td>
                        </tr>
                      )}
                      {isExpanded && rest.map((doc) => (
                        <tr
                          key={doc.id}
                          className="border-t transition-colors hover:bg-muted/30 bg-muted/10"
                        >
                          <td className="px-4 py-3 text-muted-foreground text-xs pl-8">
                            {(page - 1) * 10 + documents.indexOf(doc) + 1}
                          </td>
                          <td className="px-4 py-3" />
                          <td className="px-4 py-3" />
                          <td className="px-4 py-3">{doc.title}</td>
                          <td className="px-3 py-3 text-center">
                            <a href={`${BASE_PATH}/api/documents/${doc.id}/file`} download title={doc.originalName} className="inline-flex items-center justify-center rounded-md h-8 w-8 hover:bg-muted transition-colors">
                              <Download className="h-4 w-4 text-muted-foreground hover:text-primary" />
                            </a>
                          </td>
                          <td className="px-4 py-3">
                            <StatusBadge status={doc.status} />
                          </td>
                          <td className="px-4 py-3 text-muted-foreground text-xs">
                            {formatDateTime(doc.createdAt)}
                          </td>
                          <td className="px-4 py-3 text-muted-foreground text-xs">
                            {doc.reviewedAt ? formatDateTime(doc.reviewedAt) : "—"}
                          </td>
                          <td className="px-4 py-3 text-muted-foreground text-xs">
                            {doc.reviewedBy ?? "—"}
                          </td>
                          <td className="px-3 py-3">
                            <ActionButtons doc={doc} documents={documents} />
                          </td>
                        </tr>
                      ))}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {studentGroups.map(({ userId, docs }) => {
              const first = docs[0];
              const rest = docs.slice(1);
              const isExpanded = expandedStudents.has(userId);

              return (
                <Fragment key={userId}>
                  <DocumentCard
                    doc={first}
                    documents={documents}
                    extraFiles={rest.length}
                    isExpanded={isExpanded}
                    onToggleExpand={() => toggleStudent(userId)}
                  />
                  {isExpanded && rest.map((doc) => (
                    <DocumentCard key={doc.id} doc={doc} documents={documents} />
                  ))}
                </Fragment>
              );
            })}
          </div>
        </>
      )}

      {/* Pagination */}
      {(page > 1 || hasMore) && (
        <Pagination
          page={page}
          totalPages={totalPages}
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
      <div className="flex items-center justify-center gap-1">
        <ThesisDialog
          thesisTitleTh={doc.thesisTitleTh}
          thesisTitleEn={doc.thesisTitleEn}
          studentName={doc.studentName}
        />
        <ApproveButton documentId={doc.id} />
        {studentPendingCount > 1 && (
          <ApproveAllStudentButton userId={doc.userId} studentName={doc.studentName} />
        )}
        <RejectButton documentId={doc.id} />
        <RemoveButton documentId={doc.id} />
      </div>
    );
  }
  return (
    <div className="flex items-center justify-center gap-1">
      <ThesisDialog
        thesisTitleTh={doc.thesisTitleTh}
        thesisTitleEn={doc.thesisTitleEn}
        studentName={doc.studentName}
      />
      <RemoveButton documentId={doc.id} />
    </div>
  );
}

function ApproveButton({ documentId }: { documentId: string }) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  function handleApprove() {
    startTransition(async () => {
      const result = await approveDocument(documentId);
      if (result.error) toast.error(result.error);
      else {
        toast.success("อนุมัติเอกสารสำเร็จ");
        setOpen(false);
      }
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        title="อนุมัติ"
        className="inline-flex items-center justify-center rounded-md h-7 w-7 text-green-600 hover:bg-green-50 transition-colors"
      >
        <Check className="h-4 w-4" />
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md rounded-lg">
          <DialogHeader>
            <DialogTitle className="font-heading font-bold tracking-tight">
              ยืนยันการอนุมัติ
            </DialogTitle>
            <DialogDescription>
              ต้องการอนุมัติเอกสารนี้หรือไม่? นักศึกษาจะได้รับแจ้งทางอีเมล
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
              {pending ? "กำลังอนุมัติ..." : "อนุมัติ"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
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
      <button
        type="button"
        onClick={() => setOpen(true)}
        title="ลบ"
        className="inline-flex items-center justify-center rounded-md h-7 w-7 text-destructive hover:bg-red-50 transition-colors"
      >
        <Trash2 className="h-4 w-4" />
      </button>
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
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  function handleApproveAll() {
    startTransition(async () => {
      const result = await approveAllStudentPending(userId);
      if (result.error) toast.error(result.error);
      else {
        toast.success(`อนุมัติเอกสาร ${studentName} ทั้งหมดสำเร็จ (${result.count} รายการ)`);
        setOpen(false);
      }
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        title={`อนุมัติ ${studentName} ทั้งหมด`}
        className="inline-flex items-center justify-center rounded-md h-7 w-7 text-green-600 hover:bg-green-50 transition-colors"
      >
        <CheckCircle className="h-4 w-4" />
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md rounded-lg">
          <DialogHeader>
            <DialogTitle className="font-heading font-bold tracking-tight">
              อนุมัติเอกสารทั้งหมด
            </DialogTitle>
            <DialogDescription>
              ต้องการอนุมัติเอกสารของ {studentName} ทั้งหมดหรือไม่? นักศึกษาจะได้รับแจ้งทางอีเมล
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
              onClick={handleApproveAll}
              disabled={pending}
              className="rounded font-semibold"
            >
              {pending ? "กำลังอนุมัติ..." : "อนุมัติทั้งหมด"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function ThesisDialog({
  thesisTitleTh,
  thesisTitleEn,
  studentName,
}: {
  thesisTitleTh: string | null;
  thesisTitleEn: string | null;
  studentName: string;
}) {
  const [open, setOpen] = useState(false);
  const hasThesis = thesisTitleTh || thesisTitleEn;

  return (
    <>
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setOpen(true);
        }}
        title="ดูวิทยานิพนธ์"
        className="inline-flex items-center justify-center rounded-md h-7 w-7 text-primary hover:bg-primary/10 transition-colors"
      >
        <BookOpen className="h-4 w-4" />
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md rounded-lg">
          <DialogHeader>
            <DialogTitle className="font-heading font-bold tracking-tight">
              วิทยานิพนธ์ — {studentName}
            </DialogTitle>
          </DialogHeader>
          {hasThesis ? (
            <div className="space-y-3 text-sm">
              {thesisTitleTh && (
                <div>
                  <span className="text-muted-foreground text-xs">ชื่อไทย</span>
                  <p className="font-medium mt-0.5">{thesisTitleTh}</p>
                </div>
              )}
              {thesisTitleEn && (
                <div>
                  <span className="text-muted-foreground text-xs">ชื่ออังกฤษ</span>
                  <p className="font-medium mt-0.5">{thesisTitleEn}</p>
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">ยังไม่มีข้อมูลวิทยานิพนธ์</p>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

const STATUS_BORDER: Record<string, string> = {
  PENDING: "border-l-amber-500",
  APPROVED: "border-l-green-500",
  REJECTED: "border-l-red-500",
};

function DocumentCard({
  doc,
  documents,
  extraFiles,
  isExpanded,
  onToggleExpand,
}: {
  doc: DocumentRow;
  documents: DocumentRow[];
  extraFiles?: number;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
}) {
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
      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <span>อัปโหลด: {formatDateTime(doc.createdAt)}</span>
        {doc.reviewedAt && <span>อนุมัติ: {formatDateTime(doc.reviewedAt)}{doc.reviewedBy ? ` (${doc.reviewedBy})` : ""}</span>}
        <a
          href={`${BASE_PATH}/api/documents/${doc.id}/file`}
          download
          title={doc.originalName}
          className="inline-flex items-center gap-1.5 text-primary hover:underline ml-auto rounded-md border border-primary/20 hover:bg-primary/5 px-2.5 py-1 text-sm font-medium transition-colors"
        >
          <Download className="h-4 w-4" />
          ไฟล์
        </a>
      </div>
      <ActionButtons doc={doc} documents={documents} />
      {extraFiles != null && extraFiles > 0 && (
        <button
          type="button"
          onClick={onToggleExpand}
          className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
        >
          {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          มีอีก {extraFiles} ไฟล์
        </button>
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
