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

type DocumentRow = {
  id: string;
  title: string;
  fileName: string;
  originalName: string;
  status: string;
  adminNotes: string | null;
  createdAt: string;
  approvedAt: string | null;
};

export function ThesisClient({ documents }: { documents: DocumentRow[] }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [rows, setRows] = useState([0]);
  const [nextId, setNextId] = useState(1);
  const [state, formAction, pending] = useActionState(
    uploadDocuments,
    {} as UploadDocumentState,
  );

  const prevSuccessRef = useRef(false);
  useEffect(() => {
    if (state.success && !prevSuccessRef.current) {
      toast.success("อัปโหลดเอกสารสำเร็จ");
      formRef.current?.reset();
      setRows([0]);
      setNextId(1);
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
    setRows((r) => [...r, nextId]);
    setNextId((n) => n + 1);
  }

  function removeRow(id: number) {
    setRows((r) => r.filter((rowId) => rowId !== id));
  }

  return (
    <>
      {/* Upload form */}
      <div className="rounded border bg-card p-5 space-y-4">
        <h2 className="font-heading font-bold tracking-tight text-sm uppercase text-muted-foreground">
          อัปโหลดเอกสาร
        </h2>
        <form ref={formRef} action={formAction} className="space-y-3">
          {rows.map((rowId) => (
            <div key={rowId} className="flex items-center gap-2">
              <Input
                name={`title_${rowId}`}
                placeholder="ชื่อเครื่องมือวิจัย"
                className="rounded flex-1"
              />
              <Input
                name={`file_${rowId}`}
                type="file"
                accept=".pdf"
                className="rounded max-w-48"
              />
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
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={addRow}
              className="text-xs text-primary hover:underline inline-flex items-center gap-1"
            >
              <Plus className="h-3 w-3" />
              เพิ่มเอกสาร
            </button>
            <span className="text-xs text-muted-foreground">
              PDF เท่านั้น ขนาดสูงสุด 100 MB
            </span>
          </div>
          <Button
            type="submit"
            disabled={pending}
            className="rounded font-semibold"
          >
            <Upload className="mr-1.5 h-4 w-4" />
            {pending ? "กำลังอัปโหลด..." : "อัปโหลด"}
          </Button>
        </form>
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
                    วันที่
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
