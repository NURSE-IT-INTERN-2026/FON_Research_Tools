"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { StatusBadge } from "@/components/status-badge";
import { uploadDocuments, removeDocument, type UploadDocumentState } from "@/actions/document-actions";
import { Upload, Trash2, FileText, Download, Plus, X } from "lucide-react";
import { formatDateTime } from "@/lib/utils";

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

type DocumentRow = {
  id: string;
  title: string;
  fileName: string;
  originalName: string;
  status: string;
  adminNotes: string | null;
  createdAt: string;
  reviewedAt: string | null;
  reviewedBy: string | null;
};

export function ThesisClient({
  documents,
  studentId,
}: {
  documents: DocumentRow[];
  studentId: string | null;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const fileInputRefs = useRef<Record<number, HTMLInputElement | null>>({});
  const [rows, setRows] = useState([0]);
  const [nextId, setNextId] = useState(1);
  const [titles, setTitles] = useState<Record<number, string>>({ 0: "" });
  const [files, setFiles] = useState<Record<number, File | null>>({ 0: null });
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [state, formAction, pending] = useActionState(
    uploadDocuments,
    {} as UploadDocumentState,
  );

  const canSubmit =
    rows.length > 0 &&
    rows.every((id) => (titles[id] ?? "").trim() !== "" && files[id] != null);

  const prevSuccessRef = useRef(false);
  useEffect(() => {
    if (state.success && !prevSuccessRef.current) {
      toast.success("อัปโหลดเอกสารสำเร็จ");
      formRef.current?.reset();
      const freshId = Date.now();
      setRows([freshId]);
      setTitles({ [freshId]: "" });
      setFiles({ [freshId]: null });
      prevSuccessRef.current = true;
    }
    if (!state.success) {
      prevSuccessRef.current = false;
    }
  }, [state.success]);

  useEffect(() => {
    if (state.error) {
      toast.error(state.error);
    }
  }, [state.error]);

  function addRow() {
    const id = nextId;
    setRows((r) => [...r, id]);
    setTitles((t) => ({ ...t, [id]: "" }));
    setFiles((f) => ({ ...f, [id]: null }));
    setNextId((n) => n + 1);
  }

  const totalSize = rows.reduce((sum, id) => sum + (files[id]?.size ?? 0), 0);
  const maxTotal = 50 * 1024 * 1024;
  const approvedCount = documents.filter((d) => d.status === "APPROVED").length;
  const sizeLabel =
    totalSize === 0
      ? ""
      : `เลือกแล้ว ${formatFileSize(totalSize)} / ${formatFileSize(maxTotal)}`;

  function clearFile(rowId: number) {
    const input = fileInputRefs.current[rowId];
    if (input) input.value = "";
    setFiles((f) => ({ ...f, [rowId]: null }));
  }

  function removeRow(id: number) {
    setRows((r) => r.filter((rowId) => rowId !== id));
    setTitles((t) => {
      const next = { ...t };
      delete next[id];
      return next;
    });
    setFiles((f) => {
      const next = { ...f };
      delete next[id];
      return next;
    });
  }

  return (
    <>
      {/* Upload form */}
      <div className="rounded border bg-card p-4 md:p-5 space-y-4">
        <h2 className="font-heading font-bold tracking-tight text-sm uppercase text-muted-foreground">
          อัปโหลดเอกสาร
          <span className="block normal-case font-normal text-xs text-muted-foreground/70 mt-0.5">
            Upload Documents
          </span>
        </h2>
        <form ref={formRef} action={formAction} className="space-y-3">
          <input type="hidden" name="rowIds" value={rows.join(",")} />
          {rows.map((rowId) => (
            <div
              key={rowId}
              className="flex flex-col sm:flex-row sm:items-center gap-2"
            >
              <div className="relative flex-1">
                <Input
                  name={`title_${rowId}`}
                  placeholder="ชื่อเครื่องมือวิจัย / Research Instrument Name"
                  value={titles[rowId] ?? ""}
                  onChange={(e) =>
                    setTitles((t) => ({ ...t, [rowId]: e.target.value }))
                  }
                  className="rounded pr-8"
                />
                {(titles[rowId] ?? "").length > 0 && (
                  <button
                    type="button"
                    onClick={() => setTitles((t) => ({ ...t, [rowId]: "" }))}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
              <div className="relative sm:max-w-48">
                <Input
                  ref={(el) => { fileInputRefs.current[rowId] = el; }}
                  name={`file_${rowId}`}
                  type="file"
                  accept=".pdf"
                  onChange={(e) => {
                    const f = e.target.files?.[0] ?? null;
                    setFiles((prev) => ({ ...prev, [rowId]: f }));
                  }}
                  className="rounded"
                />
                {files[rowId] && (
                  <button
                    type="button"
                    onClick={() => clearFile(rowId)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
              {rows.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeRow(rowId)}
                  className="shrink-0 text-muted-foreground hover:text-destructive h-9 w-9 self-end sm:self-auto"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
          <span className="text-xs text-muted-foreground">
            PDF เท่านั้น ขนาดสูงสุด 50 MB · PDF only, max 50 MB{sizeLabel ? ` · ${sizeLabel}` : ""}
          </span>
          <div className="flex flex-col sm:flex-row gap-2 pt-1">
            <Button
              type="button"
              disabled={!canSubmit || pending}
              onClick={() => setConfirmOpen(true)}
              className="rounded font-semibold w-full sm:w-auto"
            >
              <Upload className="mr-1.5 h-4 w-4" />
              {pending ? "กำลังอัปโหลด..." : "อัปโหลด / Upload"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={addRow}
              className="rounded w-full sm:w-auto"
            >
              <Plus className="mr-1.5 h-4 w-4" />
              เพิ่มเอกสาร / Add
            </Button>
          </div>
        </form>

        <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
          <DialogContent className="sm:max-w-md rounded">
            <DialogHeader>
              <DialogTitle className="font-heading font-bold tracking-tight">
                ยืนยันการอัปโหลด
                <span className="block text-sm font-normal text-muted-foreground mt-0.5">
                  Confirm Upload
                </span>
              </DialogTitle>
              <DialogDescription>
                ต้องการอัปโหลดเอกสาร {rows.length} รายการหรือไม่? · Upload {rows.length} document(s)?
              </DialogDescription>
            </DialogHeader>
            <ul className="text-sm space-y-1 py-2">
              {rows.map((rowId) => (
                <li key={rowId} className="text-muted-foreground">
                  • {titles[rowId]}
                </li>
              ))}
            </ul>
            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setConfirmOpen(false)}
                className="rounded"
              >
                ยกเลิก / Cancel
              </Button>
              <Button
                type="button"
                disabled={pending}
                onClick={() => {
                  setConfirmOpen(false);
                  formRef.current?.requestSubmit();
                }}
                className="rounded font-semibold"
              >
                {pending ? "กำลังอัปโหลด..." : "ยืนยันอัปโหลด / Confirm"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Document list */}
      <div className="rounded border bg-card p-4 md:p-5 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-heading font-bold tracking-tight text-sm uppercase text-muted-foreground">
            รายการเอกสาร
            <span className="block normal-case font-normal text-xs text-muted-foreground/70 mt-0.5">
              Document List
            </span>
          </h2>
          {approvedCount > 0 && studentId && (
            <a
              href={`${basePath}/api/students/${studentId}/certificate`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-primary hover:underline text-xs rounded-md border border-primary/20 hover:bg-primary/5 px-3 py-1.5 font-medium transition-colors"
            >
              <Download className="h-3.5 w-3.5" />
              ใบรับรอง / Certificate ({approvedCount})
            </a>
          )}
        </div>

        {documents.length === 0 ? (
          <div className="rounded border border-dashed p-8 text-center text-muted-foreground text-sm">
            ยังไม่มีเอกสาร
            <span className="block text-xs mt-1">No documents yet</span>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full min-w-100 text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="px-4 py-3 text-left font-heading font-semibold text-xs uppercase tracking-wider text-muted-foreground">
                      ลำดับ<span className="block normal-case font-normal text-[10px] text-muted-foreground/70">No.</span>
                    </th>
                    <th className="px-4 py-3 text-left font-heading font-semibold text-xs uppercase tracking-wider text-muted-foreground">
                      ชื่อเครื่องมือวิจัย<span className="block normal-case font-normal text-[10px] text-muted-foreground/70">Instrument</span>
                    </th>
                    <th className="px-4 py-3 text-left font-heading font-semibold text-xs uppercase tracking-wider text-muted-foreground">
                      ไฟล์<span className="block normal-case font-normal text-[10px] text-muted-foreground/70">File</span>
                    </th>
                    <th className="px-4 py-3 text-left font-heading font-semibold text-xs uppercase tracking-wider text-muted-foreground">
                      สถานะ<span className="block normal-case font-normal text-[10px] text-muted-foreground/70">Status</span>
                    </th>
                    <th className="px-4 py-3 text-left font-heading font-semibold text-xs uppercase tracking-wider text-muted-foreground">
                      วันที่ยื่น<span className="block normal-case font-normal text-[10px] text-muted-foreground/70">Submitted</span>
                    </th>
                    <th className="px-4 py-3 text-left font-heading font-semibold text-xs uppercase tracking-wider text-muted-foreground">
                      วันที่ดำเนินการ<span className="block normal-case font-normal text-[10px] text-muted-foreground/70">Processed</span>
                    </th>
                    <th className="px-4 py-3 text-left font-heading font-semibold text-xs uppercase tracking-wider text-muted-foreground">
                      ผู้ดำเนินการ<span className="block normal-case font-normal text-[10px] text-muted-foreground/70">Reviewer</span>
                    </th>
                    <th className="px-4 py-3 text-left font-heading font-semibold text-xs uppercase tracking-wider text-muted-foreground">
                      การดำเนินการ<span className="block normal-case font-normal text-[10px] text-muted-foreground/70">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {documents.map((doc, i) => (
                    <tr
                      key={doc.id}
                      className="border-t transition-colors hover:bg-muted/30"
                    >
                      <td className="px-4 py-3 text-muted-foreground">{i + 1}</td>
                      <td className="px-4 py-3 font-medium">{doc.title}</td>
                      <td className="px-4 py-3">
                        <a
                          href={`${basePath}/api/documents/${doc.id}/file`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-primary hover:underline text-xs"
                        >
                          <FileText className="h-3.5 w-3.5" />
                          {doc.originalName}
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
                      <td className="px-4 py-3">
                        {doc.status === "PENDING" && (
                          <RemoveButton documentId={doc.id} />
                        )}
                        {doc.status === "REJECTED" && (
                          <div className="flex items-start justify-between gap-2">
                            {doc.adminNotes ? (
                              <span className="text-xs text-destructive line-clamp-2" title={doc.adminNotes}>
                                เหตุผล: {doc.adminNotes}
                                <span className="block">Reason: {doc.adminNotes}</span>
                              </span>
                            ) : (
                              <span />
                            )}
                            <RemoveButton documentId={doc.id} />
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden space-y-3">
              {documents.map((doc) => (
                <div key={doc.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-sm truncate">{doc.title}</p>
                      <a
                        href={`${basePath}/api/documents/${doc.id}/file`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-primary hover:underline text-xs mt-1"
                      >
                        <FileText className="h-3.5 w-3.5 shrink-0" />
                        <span className="truncate">{doc.originalName}</span>
                      </a>
                    </div>
                    <StatusBadge status={doc.status} />
                  </div>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                    <div>
                      <span className="text-muted-foreground">วันที่ยื่น · Submitted</span>
                      <p>{formatDateTime(doc.createdAt)}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">วันที่ดำเนินการ · Processed</span>
                      <p>{doc.reviewedAt ? formatDateTime(doc.reviewedAt) : "—"}</p>
                    </div>
                    {doc.reviewedBy && (
                      <div>
                        <span className="text-muted-foreground">ผู้ดำเนินการ · Reviewer</span>
                        <p>{doc.reviewedBy}</p>
                      </div>
                    )}
                  </div>
                  {doc.status === "REJECTED" && doc.adminNotes && (
                    <p className="text-xs text-destructive">
                      เหตุผล: {doc.adminNotes}
                      <span className="block">Reason: {doc.adminNotes}</span>
                    </p>
                  )}
                  <div className="flex justify-end pt-1">
                    {doc.status === "PENDING" && (
                      <RemoveButton documentId={doc.id} />
                    )}
                    {doc.status === "REJECTED" && (
                      <RemoveButton documentId={doc.id} />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </>
  );
}

function RemoveButton({ documentId }: { documentId: string }) {
  const [confirmOpen, setConfirmOpen] = useState(false);
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

  if (state.success && confirmOpen) {
    setConfirmOpen(false);
  }

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => setConfirmOpen(true)}
        className="text-destructive hover:text-destructive rounded h-8"
      >
        <Trash2 className="h-3.5 w-3.5 mr-1" />
        ลบ / Delete
      </Button>
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="sm:max-w-md rounded">
          <DialogHeader>
            <DialogTitle className="font-heading font-bold tracking-tight">
              ยืนยันการลบ
              <span className="block text-sm font-normal text-muted-foreground mt-0.5">
                Confirm Delete
              </span>
            </DialogTitle>
            <DialogDescription>
              ต้องการลบเอกสารนี้หรือไม่? การกระทำนี้ไม่สามารถย้อนกลับได้ · Delete this document? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setConfirmOpen(false)}
              className="rounded"
            >
              ยกเลิก / Cancel
            </Button>
            <form action={formAction}>
              <input type="hidden" name="documentId" value={documentId} />
              <Button
                type="submit"
                disabled={pending}
                variant="destructive"
                className="rounded font-semibold"
              >
                {pending ? "กำลังลบ..." : "ลบ / Delete"}
              </Button>
            </form>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
