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
import { ArrowLeft, Check, CheckCircle, XCircle, Trash2, FileText, Clock, ShieldCheck, AlertTriangle, Download } from "lucide-react";
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

      {/* Student header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight heading-accent">
            {student.name}
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            รหัสนักศึกษา <span className="font-mono font-medium">{student.studentId}</span>
          </p>
        </div>
        {pendingCount > 0 && (
          <ApproveAllButton userId={student.id} studentName={student.name} count={pendingCount} />
        )}
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
        <div className="flex items-center justify-between">
          <h2 className="font-heading font-bold tracking-tight text-sm uppercase text-muted-foreground">
            เอกสารเครื่องมือวิจัย
          </h2>
        </div>

        {/* Status summary */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatusCard icon={<FileText className="h-4 w-4" />} label="ทั้งหมด" value={documents.length} color="text-blue-600 bg-blue-50" />
          <StatusCard icon={<Clock className="h-4 w-4" />} label="รอตรวจสอบ" value={pendingCount} color="text-amber-600 bg-amber-50" />
          <StatusCard icon={<ShieldCheck className="h-4 w-4" />} label="อนุมัติแล้ว" value={approvedCount} color="text-green-600 bg-green-50" />
          <StatusCard icon={<AlertTriangle className="h-4 w-4" />} label="ปฏิเสธแล้ว" value={rejectedCount} color="text-red-600 bg-red-50" />
        </div>

        {documents.length === 0 ? (
          <div className="rounded-lg border border-dashed p-10 text-center text-muted-foreground">
            ยังไม่มีเอกสาร
          </div>
        ) : (
          <div className="space-y-3">
            {documents.map((doc) => (
              <DocumentCard key={doc.id} doc={doc} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatusCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: number; color: string }) {
  return (
    <div className={`rounded-lg border p-3 flex items-center gap-3 ${color}`}>
      <div className="shrink-0">{icon}</div>
      <div>
        <p className="text-xl font-bold leading-none">{value}</p>
        <p className="text-xs mt-0.5 opacity-80">{label}</p>
      </div>
    </div>
  );
}

function DocumentCard({ doc }: { doc: DocumentRow }) {
  const borderColor =
    doc.status === "PENDING"
      ? "border-l-amber-400"
      : doc.status === "APPROVED"
      ? "border-l-green-400"
      : "border-l-red-400";

  return (
    <div className={`rounded-lg border bg-card border-l-4 ${borderColor} overflow-hidden`}>
      <div className="p-4 sm:p-5">
        {/* Top row: title + status */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h3 className="font-medium text-sm sm:text-base wrap-break-word">{doc.title}</h3>
            <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-muted-foreground">
              <a
                href={`/api/documents/${doc.id}/file`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-primary hover:underline"
              >
                <FileText className="h-3.5 w-3.5" />
                {doc.originalName}
              </a>
              <span>ยื่นเมื่อ {formatDateTime(doc.createdAt)}</span>
            </div>
          </div>
          <div className="shrink-0">
            <StatusBadge status={doc.status} />
          </div>
        </div>

        {/* Approved info */}
        {doc.status === "APPROVED" && doc.approvedAt && (
          <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground bg-green-50 rounded-md px-3 py-2">
            <ShieldCheck className="h-3.5 w-3.5 text-green-600 shrink-0" />
            <span>
              อนุมัติเมื่อ {formatDateTime(doc.approvedAt)}
              {doc.approvedBy && ` โดย ${doc.approvedBy}`}
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
        <div className="mt-4 flex flex-wrap items-center gap-2 pt-3 border-t">
          {doc.status === "PENDING" && (
            <>
              <ApproveButton documentId={doc.id} />
              <RejectButton documentId={doc.id} />
              <div className="flex-1" />
              <RemoveButton documentId={doc.id} />
            </>
          )}
          {doc.status === "APPROVED" && (
            <>
              <a
                href={`/api/documents/${doc.id}/certificate`}
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
      className="rounded-md h-8 text-xs"
    >
      <Check className="h-3.5 w-3.5 mr-1" />
      {pending ? "กำลังอนุมัติ..." : "อนุมัติ"}
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

function ApproveAllButton({
  userId,
  studentName,
  count,
}: {
  userId: string;
  studentName: string;
  count: number;
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  function handleApproveAll() {
    startTransition(async () => {
      const result = await approveAllStudentPending(userId);
      if (result.error) toast.error(result.error);
      else {
        toast.success(
          `อนุมัติเอกสาร ${studentName} ทั้งหมดสำเร็จ (${result.count} รายการ)`,
        );
        setOpen(false);
      }
    });
  }

  return (
    <>
      <Button
        type="button"
        variant="secondary"
        size="sm"
        onClick={() => setOpen(true)}
        className="rounded-md"
      >
        <CheckCircle className="h-3.5 w-3.5 mr-1" />
        อนุมัติทั้งหมด ({count})
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md rounded-lg">
          <DialogHeader>
            <DialogTitle className="font-heading font-bold tracking-tight">
              อนุมัติเอกสารทั้งหมด
            </DialogTitle>
            <DialogDescription>
              ต้องการอนุมัติเอกสารของ {studentName} ทั้งหมด {count} รายการหรือไม่? นักศึกษาจะได้รับแจ้งทางอีเมล
            </DialogDescription>
          </DialogHeader>
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
              onClick={handleApproveAll}
              disabled={pending}
              className="rounded-md font-semibold"
            >
              {pending ? "กำลังอนุมัติ..." : `อนุมัติ ${count} รายการ`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
