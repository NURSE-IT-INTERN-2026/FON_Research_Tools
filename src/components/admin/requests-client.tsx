"use client";

import { useActionState, useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { StatusBadge } from "@/components/status-badge";
import { FilterPills } from "@/components/filter-pills";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  approveBooking,
  rejectBooking,
  markReturned,
  markOverdue,
  type ActionState,
} from "@/actions/booking-actions";
import { CheckCircle, XCircle, RotateCcw, AlertTriangle } from "lucide-react";

type BookingRow = {
  id: string;
  borrowerName: string;
  borrowerDept: string;
  toolName: string;
  startDate: string;
  endDate: string;
  purpose: string;
  status: string;
  adminNotes: string | null;
};

type RequestsClientProps = {
  bookings: BookingRow[];
  currentStatus: string;
};

const STATUS_OPTIONS = [
  { label: "ทั้งหมด", value: "ALL" },
  { label: "รอตรวจสอบ", value: "PENDING" },
  { label: "อนุมัติแล้ว", value: "APPROVED" },
  { label: "ปฏิเสธแล้ว", value: "REJECTED" },
  { label: "คืนแล้ว", value: "RETURNED" },
  { label: "เกินกำหนด", value: "OVERDUE" },
];

function NotesDialog({
  open,
  onOpenChange,
  bookingId,
  action,
  title,
  description,
  confirmLabel,
  variant,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bookingId: string;
  action: (_prev: ActionState, formData: FormData) => Promise<ActionState>;
  title: string;
  description: string;
  confirmLabel: string;
  variant: "default" | "destructive";
}) {
  const [state, formAction, pending] = useActionState(action, {} as ActionState);

  useEffect(() => {
    if (state.success) {
      toast.success(title + "สำเร็จ");
      onOpenChange(false);
    }
  }, [state.success, title, onOpenChange]);

  useEffect(() => {
    if (state.error) toast.error(state.error);
  }, [state.error]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <form action={formAction} className="grid gap-4 py-2">
          <input type="hidden" name="bookingId" value={bookingId} />
          <div className="space-y-2">
            <Label htmlFor="adminNotes">หมายเหตุ (ไม่บังคับ)</Label>
            <Textarea
              id="adminNotes"
              name="adminNotes"
              rows={3}
              placeholder="เพิ่มหมายเหตุ..."
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              ยกเลิก
            </Button>
            <Button type="submit" variant={variant} disabled={pending}>
              {pending ? "กำลังดำเนินการ..." : confirmLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ActionButtons({ booking }: { booking: BookingRow }) {
  const [dialogType, setDialogType] = useState<"approve" | "reject" | null>(null);
  const [returnState, returnAction, returnPending] = useActionState(markReturned, {} as ActionState);
  const [overdueState, overdueAction, overduePending] = useActionState(markOverdue, {} as ActionState);

  useEffect(() => {
    if (returnState.success) toast.success("บันทึกการคืนสำเร็จ");
  }, [returnState.success]);

  useEffect(() => {
    if (returnState.error) toast.error(returnState.error);
  }, [returnState.error]);

  useEffect(() => {
    if (overdueState.success) toast.success("ตั้งค่าเกินกำหนดสำเร็จ");
  }, [overdueState.success]);

  useEffect(() => {
    if (overdueState.error) toast.error(overdueState.error);
  }, [overdueState.error]);

  const dialogOpen = dialogType !== null;

  return (
    <>
      {booking.status === "PENDING" && (
        <>
          <Button size="sm" onClick={() => setDialogType("approve")}>
            <CheckCircle className="mr-1 h-3.5 w-3.5" />
            อนุมัติ
          </Button>
          <Button size="sm" variant="outline" onClick={() => setDialogType("reject")}>
            <XCircle className="mr-1 h-3.5 w-3.5" />
            ปฏิเสธ
          </Button>
        </>
      )}

      {booking.status === "APPROVED" && (
        <>
          <form action={returnAction}>
            <input type="hidden" name="bookingId" value={booking.id} />
            <Button type="submit" size="sm" disabled={returnPending}>
              <RotateCcw className="mr-1 h-3.5 w-3.5" />
              {returnPending ? "กำลังบันทึก..." : "คืนแล้ว"}
            </Button>
          </form>
          <form action={overdueAction}>
            <input type="hidden" name="bookingId" value={booking.id} />
            <Button type="submit" size="sm" variant="outline" disabled={overduePending}>
              <AlertTriangle className="mr-1 h-3.5 w-3.5" />
              เกินกำหนด
            </Button>
          </form>
        </>
      )}

      {booking.status === "OVERDUE" && (
        <form action={returnAction}>
          <input type="hidden" name="bookingId" value={booking.id} />
          <Button type="submit" size="sm" disabled={returnPending}>
            <RotateCcw className="mr-1 h-3.5 w-3.5" />
            {returnPending ? "กำลังบันทึก..." : "คืนแล้ว"}
          </Button>
        </form>
      )}

      {dialogType === "approve" && (
        <NotesDialog
          open={dialogOpen}
          onOpenChange={(open) => { if (!open) setDialogType(null); }}
          bookingId={booking.id}
          action={approveBooking}
          title="อนุมัติคำขอยืม"
          description={`อนุมัติคำขอยืม "${booking.toolName}" ของ ${booking.borrowerName}`}
          confirmLabel="อนุมัติ"
          variant="default"
        />
      )}

      {dialogType === "reject" && (
        <NotesDialog
          open={dialogOpen}
          onOpenChange={(open) => { if (!open) setDialogType(null); }}
          bookingId={booking.id}
          action={rejectBooking}
          title="ปฏิเสธคำขอยืม"
          description={`ปฏิเสธคำขอยืม "${booking.toolName}" ของ ${booking.borrowerName}`}
          confirmLabel="ปฏิเสธ"
          variant="destructive"
        />
      )}
    </>
  );
}

export function RequestsClient({ bookings, currentStatus }: RequestsClientProps) {
  return (
    <div className="space-y-4">
      <FilterPills
        paramName="status"
        options={STATUS_OPTIONS}
        selected={currentStatus}
        basePath="/admin/requests"
      />

      {bookings.length === 0 ? (
        <div className="rounded-lg border border-dashed p-10 text-center text-muted-foreground">
          ไม่พบคำขอยืม
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border bg-card">
          <table className="w-full min-w-[700px] text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 text-left font-medium">ผู้ยืม</th>
                <th className="px-4 py-3 text-left font-medium">อุปกรณ์</th>
                <th className="px-4 py-3 text-left font-medium">วันที่</th>
                <th className="px-4 py-3 text-left font-medium">วัตถุประสงค์</th>
                <th className="px-4 py-3 text-left font-medium">สถานะ</th>
                <th className="px-4 py-3 text-right font-medium">การดำเนินการ</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((booking) => (
                <tr
                  key={booking.id}
                  className="border-t transition-colors hover:bg-muted/30"
                >
                  <td className="px-4 py-3">
                    <p className="font-medium">{booking.borrowerName}</p>
                    {booking.borrowerDept && (
                      <p className="text-xs text-muted-foreground">
                        {booking.borrowerDept}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3">{booking.toolName}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                    {booking.startDate} — {booking.endDate}
                  </td>
                  <td className="max-w-[200px] px-4 py-3">
                    <p className="line-clamp-2 text-muted-foreground">
                      {booking.purpose}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={booking.status} type="booking" />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <ActionButtons booking={booking} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
