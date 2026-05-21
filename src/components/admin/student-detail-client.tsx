"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
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
  approveAllStudentPending,
  rejectDocument,
  removeDocument,
  type UploadDocumentState,
} from "@/actions/document-actions";
import type { ThesisData } from "@/lib/auth/cmu-oauth";
import { ArrowLeft, Check, CheckCircle, XCircle, Trash2, FileText } from "lucide-react";
import { formatDateTime } from "@/lib/utils";

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
  approvedBy: string | null;
  approvedAt: string | null;
  createdAt: string;
};

type StudentDetailClientProps = {
  student: StudentInfo;
  thesis: ThesisData;
  documents: DocumentRow[];
};

export function StudentDetailClient({
  student,
  thesis,
  documents,
}: StudentDetailClientProps) {
  const pendingCount = documents.filter((d) => d.status === "PENDING").length;
  const approvedCount = documents.filter((d) => d.status === "APPROVED").length;
  const rejectedCount = documents.filter((d) => d.status === "REJECTED").length;

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Link
        href="/admin/students"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        กลับไปรายชื่อนักศึกษา
      </Link>

      <div>
        <h1 className="font-heading text-2xl font-bold tracking-tight heading-accent">
          {student.name}
        </h1>
        <p className="text-muted-foreground mt-1">
          รหัสนักศึกษา {student.studentId}
        </p>
      </div>

      {/* Profile card */}
      <div className="rounded border bg-card p-5 space-y-3">
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
      <div className="rounded border bg-card p-5 space-y-3">
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
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-heading font-bold tracking-tight text-sm uppercase text-muted-foreground">
              เอกสารเครื่องมือวิจัย
            </h2>
            <p className="text-xs text-muted-foreground mt-1">
              ทั้งหมด {documents.length} รายการ — รอตรวจสอบ {pendingCount} / อนุมัติแล้ว {approvedCount} / ปฏิเสธแล้ว {rejectedCount}
            </p>
          </div>
          {pendingCount > 0 && (
            <ApproveAllButton userId={student.id} studentName={student.name} />
          )}
        </div>

        {documents.length === 0 ? (
          <div className="rounded border border-dashed p-10 text-center text-muted-foreground">
            ยังไม่มีเอกสาร
          </div>
        ) : (
          <div className="overflow-x-auto rounded border bg-card">
            <table className="w-full min-w-120 text-sm">
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
                    <td className="px-4 py-3 text-muted-foreground">{i + 1}</td>
                    <td className="px-4 py-3 font-medium">{doc.title}</td>
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
                      {formatDateTime(doc.createdAt)}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">
                      {doc.approvedAt ? formatDateTime(doc.approvedAt) : "—"}
                    </td>
                    <td className="px-4 py-3">
                      {doc.status === "PENDING" && (
                        <div className="flex items-center gap-1.5">
                          <ApproveButton documentId={doc.id} />
                          <RejectButton documentId={doc.id} />
                          <RemoveButton documentId={doc.id} />
                        </div>
                      )}
                      {doc.status === "APPROVED" && (
                        <RemoveButton documentId={doc.id} />
                      )}
                      {doc.status === "REJECTED" && (
                        <div className="flex items-start justify-between gap-2">
                          {doc.adminNotes && (
                            <span className="text-xs text-destructive line-clamp-2" title={doc.adminNotes}>
                              เหตุผล: {doc.adminNotes}
                            </span>
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
    </div>
  );
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

function ApproveAllButton({
  userId,
  studentName,
}: {
  userId: string;
  studentName: string;
}) {
  const [pending, startTransition] = useTransition();

  function handleApproveAll() {
    startTransition(async () => {
      const result = await approveAllStudentPending(userId);
      if (result.error) toast.error(result.error);
      else
        toast.success(
          `อนุมัติเอกสาร ${studentName} ทั้งหมดสำเร็จ (${result.count} รายการ)`,
        );
    });
  }

  return (
    <Button
      type="button"
      variant="secondary"
      size="sm"
      onClick={handleApproveAll}
      disabled={pending}
      className="rounded"
    >
      <CheckCircle className="h-3.5 w-3.5 mr-1" />
      {pending ? "..." : "อนุมัติทั้งหมด"}
    </Button>
  );
}
