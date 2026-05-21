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
  approvedAt: string | null;
  approvedBy: string | null;
};

export function ThesisClient({ documents }: { documents: DocumentRow[] }) {
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

  // Submit is enabled only when every row has both title and file
  const canSubmit =
    rows.length > 0 &&
    rows.every((id) => (titles[id] ?? "").trim() !== "" && files[id] != null);

  const prevSuccessRef = useRef(false);
  useEffect(() => {
    if (state.success && !prevSuccessRef.current) {
      toast.success("อัปโหลดเอกสารสำเร็จ");
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

  // Compute total size of selected files
  const totalSize = rows.reduce((sum, id) => sum + (files[id]?.size ?? 0), 0);
  const maxTotal = 10 * 1024 * 1024; // 10 MB
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
      <div className="rounded border bg-card p-5 space-y-4">
        <h2 className="font-heading font-bold tracking-tight text-sm uppercase text-muted-foreground">
          อัปโหลดเอกสาร
        </h2>
        <form ref={formRef} action={formAction} className="space-y-3">
          <input type="hidden" name="rowIds" value={rows.join(",")} />
          {rows.map((rowId) => (
            <div key={rowId} className="flex items-center gap-2">
              <div className="relative flex-1">
                <Input
                  name={`title_${rowId}`}
                  placeholder="ชื่อเครื่องมือวิจัย"
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
              <div className="relative max-w-48">
                <Input
                  ref={(el) => { fileInputRefs.current[rowId] = el; }}
                  name={`file_${rowId}`}
                  type="file"
                  accept=".pdf"
                  onChange={(e) => {
                    const f = e.target.files?.[0] ?? null;
                    setFiles((prev) => ({ ...prev, [rowId]: f }));
                  }}
                  className="rounded pr-8"
                />
                {files[rowId] && (
                  <button
                    type="button"
                    onClick={() => clearFile(rowId)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
              {rows.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeRow(rowId)}
                  className="shrink-0 text-muted-foreground hover:text-destructive h-9 w-9"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
          <span className="text-xs text-muted-foreground">
            PDF เท่านั้น ขนาดสูงสุด 10 MB{sizeLabel ? ` · ${sizeLabel}` : ""}
          </span>
          <div className="flex items-center gap-2 pt-1">
            <Button
              type="button"
              disabled={!canSubmit || pending}
              onClick={() => setConfirmOpen(true)}
              className="rounded font-semibold"
            >
              <Upload className="mr-1.5 h-4 w-4" />
              {pending ? "กำลังอัปโหลด..." : "อัปโหลด"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={addRow}
              className="rounded"
            >
              <Plus className="mr-1.5 h-4 w-4" />
              เพิ่มเอกสาร
            </Button>
          </div>
        </form>

        <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
          <DialogContent className="sm:max-w-md rounded">
            <DialogHeader>
              <DialogTitle className="font-heading font-bold tracking-tight">
                ยืนยันการอัปโหลด
              </DialogTitle>
              <DialogDescription>
                ต้องการอัปโหลดเอกสาร {rows.length} รายการหรือไม่?
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
                ยกเลิก
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
                {pending ? "กำลังอัปโหลด..." : "ยืนยันอัปโหลด"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Document list */}
      <div className="rounded border bg-card p-5 space-y-4">
        <h2 className="font-heading font-bold tracking-tight text-sm uppercase text-muted-foreground">
          รายการเอกสาร
        </h2>

        {documents.length === 0 ? (
          <div className="rounded border border-dashed p-8 text-center text-muted-foreground text-sm">
            ยังไม่มีเอกสาร
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-100 text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-3 text-left font-heading font-semibold text-xs uppercase tracking-wider text-muted-foreground">
                    ลำดับ
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
                    วันที่ยื่น
                  </th>
                  <th className="px-4 py-3 text-left font-heading font-semibold text-xs uppercase tracking-wider text-muted-foreground">
                    วันที่อนุมัติ
                  </th>
                  <th className="px-4 py-3 text-left font-heading font-semibold text-xs uppercase tracking-wider text-muted-foreground">
                    ผู้อนุมัติ
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
                      {doc.approvedAt ? formatDateTime(doc.approvedAt) : "—"}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">
                      {doc.approvedBy ?? "—"}
                    </td>
                    <td className="px-4 py-3">
                      {doc.status === "PENDING" && (
                        <RemoveButton documentId={doc.id} />
                      )}
                      {doc.status === "APPROVED" && (
                        <a
                          href={`${basePath}/api/documents/${doc.id}/certificate`}
                          download
                          className="inline-flex items-center gap-1 text-primary hover:underline text-xs"
                        >
                          <Download className="h-3.5 w-3.5" />
                          ใบรับรอง
                        </a>
                      )}
                      {doc.status === "REJECTED" && (
                        <div className="flex items-start justify-between gap-2">
                          {doc.adminNotes ? (
                            <span className="text-xs text-destructive line-clamp-2" title={doc.adminNotes}>
                              เหตุผล: {doc.adminNotes}
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
        ลบ
      </Button>
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
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
              onClick={() => setConfirmOpen(false)}
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
