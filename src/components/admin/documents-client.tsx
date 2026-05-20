"use client";

import { Suspense, useActionState, useState, useEffect, useRef, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
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
import { FilterPills } from "@/components/filter-pills";
import { StatusBadge } from "@/components/status-badge";
import {
  approveDocument,
  approveAllPending,
  rejectDocument,
  removeDocument,
  type UploadDocumentState,
} from "@/actions/document-actions";
import { CheckCircle, XCircle, Trash2, FileText, Check } from "lucide-react";

type DocumentRow = {
  id: string;
  title: string;
  originalName: string;
  studentName: string;
  studentId: string;
  status: string;
  createdAt: string;
};

type DocumentsClientProps = {
  documents: DocumentRow[];
  currentStatus: string;
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
  page,
  hasMore,
}: DocumentsClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

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
      {/* Toolbar: filter + approve all */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Suspense>
          <FilterPills
            paramName="status"
            options={STATUS_OPTIONS}
            selected={currentStatus}
            basePath="/admin/documents"
            resetParams={["page"]}
          />
        </Suspense>
        <ApproveAllButton />
      </div>

      {/* Table */}
      {documents.length === 0 ? (
        <div className="rounded border border-dashed p-10 text-center text-muted-foreground">
          ไม่พบเอกสาร
        </div>
      ) : (
        <div className="overflow-x-auto rounded border bg-card">
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
                  ไฟล์
                </th>
                <th className="px-4 py-3 text-left font-heading font-semibold text-xs uppercase tracking-wider text-muted-foreground">
                  สถานะ
                </th>
                <th className="px-4 py-3 text-left font-heading font-semibold text-xs uppercase tracking-wider text-muted-foreground">
                  วันที่อัปโหลด
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
                  <td className="px-4 py-3 font-medium">{doc.studentName}</td>
                  <td className="px-4 py-3 text-muted-foreground font-mono text-xs">
                    {doc.studentId}
                  </td>
                  <td className="px-4 py-3">{doc.title}</td>
                  <td className="px-4 py-3">
                    <a
                      href={`/api/documents/${doc.id}/file`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-primary hover:underline text-xs"
                    >
                      <FileText className="h-3.5 w-3.5" />
                      PDF
                    </a>
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={doc.status} />
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">
                    {formatDate(doc.createdAt)}
                  </td>
                  <td className="px-4 py-3">
                    <ActionButtons doc={doc} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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

function ActionButtons({ doc }: { doc: DocumentRow }) {
  if (doc.status === "PENDING") {
    return (
      <div className="flex items-center gap-1.5">
        <ApproveButton documentId={doc.id} />
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

function ApproveAllButton() {
  const [pending, startTransition] = useTransition();

  function handleApproveAll() {
    startTransition(async () => {
      const result = await approveAllPending();
      if (result.error) toast.error(result.error);
      else toast.success(`อนุมัติเอกสารทั้งหมดสำเร็จ (${result.count} รายการ)`);
    });
  }

  return (
    <Button
      type="button"
      onClick={handleApproveAll}
      disabled={pending}
      className="rounded font-semibold"
    >
      <CheckCircle className="h-4 w-4 mr-1.5" />
      {pending ? "กำลังอนุมัติ..." : "อนุมัติทั้งหมด"}
    </Button>
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

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("th-TH", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}
