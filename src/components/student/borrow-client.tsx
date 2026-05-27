"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  submitBorrowRequest,
  removeBorrowing,
  type BorrowingActionState,
} from "@/actions/borrowing-actions";
import { StatusBadge } from "@/components/status-badge";
import { Upload, Trash2, FileText } from "lucide-react";
import { formatDateTime } from "@/lib/utils";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

type Instrument = { id: string; name: string };

type BorrowRecord = {
  id: string;
  requesterName: string | null;
  requestDate: string | null;
  additionalDetails: string | null;
  status: string;
  adminNotes: string | null;
  createdAt: string;
  reviewedAt: string | null;
  licenseOriginalName: string | null;
  instrument: { name: string };
};

export function BorrowClient({
  instruments,
  records,
}: {
  instruments: Instrument[];
  records: BorrowRecord[];
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [selectedInstrument, setSelectedInstrument] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [state, formAction, pending] = useActionState(
    submitBorrowRequest,
    {} as BorrowingActionState,
  );

  const canSubmit =
    selectedInstrument.trim() !== "" &&
    file != null;

  const prevSuccessRef = useRef(false);
  useEffect(() => {
    if (state.success && !prevSuccessRef.current) {
      toast.success("ส่งคำขอยืมสำเร็จ");
      formRef.current?.reset();
      setSelectedInstrument("");
      setFile(null);
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

  return (
    <>
      {/* Borrow form */}
      <div className="rounded border bg-card p-4 md:p-5 space-y-4">
        <h2 className="font-heading font-bold tracking-tight text-sm uppercase text-muted-foreground">
          ฟอร์มขอยืมเครื่องมือวิจัย
        </h2>

        {instruments.length === 0 ? (
          <div className="rounded border border-dashed p-8 text-center text-muted-foreground text-sm">
            ยังไม่มีเครื่องมือวิจัยในระบบ
          </div>
        ) : (
          <form ref={formRef} action={formAction} className="space-y-4">
            {/* Instrument select */}
            <div className="space-y-1.5">
              <Label htmlFor="instrumentId">เครื่องมือวิจัย</Label>
              <select
                id="instrumentId"
                name="instrumentId"
                value={selectedInstrument}
                onChange={(e) => setSelectedInstrument(e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="">— เลือกเครื่องมือวิจัย —</option>
                {instruments.map((inst) => (
                  <option key={inst.id} value={inst.id}>
                    {inst.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Requester name */}
            <div className="space-y-1.5">
              <Label htmlFor="requesterName">ชื่อผู้ขอ</Label>
              <Input
                id="requesterName"
                name="requesterName"
                placeholder="ชื่อ-นามสกุล"
                className="rounded"
              />
            </div>

            {/* Request date */}
            <div className="space-y-1.5">
              <Label htmlFor="requestDate">วันที่ขอ</Label>
              <Input
                id="requestDate"
                name="requestDate"
                type="date"
                className="rounded"
              />
            </div>

            {/* Additional details */}
            <div className="space-y-1.5">
              <Label htmlFor="additionalDetails">รายละเอียดเพิ่มเติม</Label>
              <textarea
                id="additionalDetails"
                name="additionalDetails"
                rows={3}
                placeholder="รายละเอียดเพิ่มเติม (ถ้ามี)"
                className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
            </div>

            {/* License upload */}
            <div className="space-y-1.5">
              <Label htmlFor="licenseFile">ใบอนุญาต / ใบรับรอง (PDF)</Label>
              <Input
                id="licenseFile"
                name="licenseFile"
                type="file"
                accept=".pdf"
                onChange={(e) => {
                  const f = e.target.files?.[0] ?? null;
                  setFile(f);
                }}
                className="rounded"
              />
              <span className="text-xs text-muted-foreground">
                PDF เท่านั้น ขนาดสูงสุด 10 MB
              </span>
            </div>

            <Button
              type="button"
              disabled={!canSubmit || pending}
              onClick={() => setConfirmOpen(true)}
              className="rounded font-semibold"
            >
              <Upload className="mr-1.5 h-4 w-4" />
              {pending ? "กำลังส่ง..." : "ส่งคำขอยืม"}
            </Button>
          </form>
        )}

        <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
          <DialogContent className="sm:max-w-md rounded">
            <DialogHeader>
              <DialogTitle className="font-heading font-bold tracking-tight">
                ยืนยันการส่งคำขอยืม
              </DialogTitle>
              <DialogDescription>
                ต้องการส่งคำขอยืมเครื่องมือวิจัยนี้หรือไม่?
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
              <Button
                type="button"
                disabled={pending}
                onClick={() => {
                  setConfirmOpen(false);
                  formRef.current?.requestSubmit();
                }}
                className="rounded font-semibold"
              >
                {pending ? "กำลังส่ง..." : "ยืนยันส่งคำขอ"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Borrowing history */}
      <div className="rounded border bg-card p-4 md:p-5 space-y-4">
        <h2 className="font-heading font-bold tracking-tight text-sm uppercase text-muted-foreground">
          ประวัติการยืมของฉัน
        </h2>

        {records.length === 0 ? (
          <div className="rounded border border-dashed p-8 text-center text-muted-foreground text-sm">
            ยังไม่มีประวัติการยืม
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full min-w-100 text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="px-4 py-3 text-left font-heading font-semibold text-xs uppercase tracking-wider text-muted-foreground">
                      ลำดับ
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
                      <td className="px-4 py-3 text-muted-foreground">{i + 1}</td>
                      <td className="px-4 py-3 font-medium">{rec.instrument.name}</td>
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
                            {rec.licenseOriginalName}
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
                          <RemoveRecordButton recordId={rec.id} />
                        )}
                        {rec.status === "REJECTED" && rec.adminNotes && (
                          <span
                            className="text-xs text-destructive line-clamp-2"
                            title={rec.adminNotes}
                          >
                            เหตุผล: {rec.adminNotes}
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
                      <p className="font-medium text-sm truncate">
                        {rec.instrument.name}
                      </p>
                      {rec.requesterName && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          ผู้ขอ: {rec.requesterName}
                        </p>
                      )}
                    </div>
                    <StatusBadge status={rec.status} />
                  </div>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
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
                      <span className="truncate">{rec.licenseOriginalName}</span>
                    </a>
                  )}
                  {rec.status === "REJECTED" && rec.adminNotes && (
                    <p className="text-xs text-destructive">
                      เหตุผล: {rec.adminNotes}
                    </p>
                  )}
                  {rec.status === "PENDING" && (
                    <div className="flex justify-end pt-1">
                      <RemoveRecordButton recordId={rec.id} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </>
  );
}

function RemoveRecordButton({ recordId }: { recordId: string }) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [state, formAction, pending] = useActionState(
    removeBorrowing,
    {} as BorrowingActionState,
  );
  const prevSuccessRef = useRef(false);

  useEffect(() => {
    if (state.error) toast.error(state.error);
  }, [state.error]);

  useEffect(() => {
    if (state.success && !prevSuccessRef.current) {
      prevSuccessRef.current = true;
      toast.success("ลบคำขอยืมสำเร็จ");
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
              ต้องการลบคำขอยืมนี้หรือไม่? การกระทำนี้ไม่สามารถย้อนกลับได้
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
              <input type="hidden" name="recordId" value={recordId} />
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
