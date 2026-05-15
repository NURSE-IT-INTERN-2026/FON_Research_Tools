"use client";

import { useActionState } from "react";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { cancelBooking } from "@/actions/cancel-booking";
import { Wrench, Calendar, FileText, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import { useEffect } from "react";

type BookingData = {
  id: string;
  toolName: string;
  toolCategory: string;
  toolImageUrl: string | null;
  startDate: string;
  endDate: string;
  purpose: string;
  status: string;
  adminNotes: string | null;
};

type BookingCardProps = {
  booking: BookingData;
};

function CancelButton({ bookingId }: { bookingId: string }) {
  const [state, formAction, pending] = useActionState(
    async (_prev: { success?: boolean; error?: string }, formData: FormData) => {
      const id = formData.get("bookingId") as string;
      return cancelBooking(id);
    },
    {} as { success?: boolean; error?: string },
  );

  useEffect(() => {
    if (state.error) toast.error(state.error);
  }, [state.error]);

  return (
    <form action={formAction}>
      <input type="hidden" name="bookingId" value={bookingId} />
      <Button type="submit" variant="outline" size="sm" disabled={pending}>
        {pending ? "กำลังยกเลิก..." : "ยกเลิกคำขอ"}
      </Button>
    </form>
  );
}

function BookingCard({ booking }: BookingCardProps) {
  return (
    <div className="flex gap-4 rounded-xl border bg-card p-4">
      <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-lg bg-muted">
        {booking.toolImageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={booking.toolImageUrl}
            alt={booking.toolName}
            className="h-full w-full rounded-lg object-cover"
          />
        ) : (
          <Wrench className="h-8 w-8 text-muted-foreground/40" />
        )}
      </div>

      <div className="flex-1 space-y-1.5">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="font-semibold">{booking.toolName}</h3>
            <p className="text-xs font-medium text-primary">{booking.toolCategory}</p>
          </div>
          <StatusBadge status={booking.status} type="booking" />
        </div>

        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {booking.startDate} — {booking.endDate}
          </span>
        </div>

        <p className="flex items-start gap-1 text-sm text-muted-foreground">
          <FileText className="mt-0.5 h-3 w-3 shrink-0" />
          <span className="line-clamp-1">{booking.purpose}</span>
        </p>

        {booking.adminNotes && (
          <p className="flex items-start gap-1 text-xs text-muted-foreground">
            <MessageSquare className="mt-0.5 h-3 w-3 shrink-0" />
            <span className="line-clamp-1">{booking.adminNotes}</span>
          </p>
        )}

        {booking.status === "PENDING" && (
          <div className="pt-1">
            <CancelButton bookingId={booking.id} />
          </div>
        )}
      </div>
    </div>
  );
}

type MyBookingsClientProps = {
  bookings: BookingData[];
  tab: string;
  counts: { current: number; pending: number; past: number };
};

const TABS = [
  { key: "current", label: "ปัจจุบัน" },
  { key: "pending", label: "รอตรวจสอบ" },
  { key: "past", label: "ที่ผ่านมา" },
] as const;

export function MyBookingsClient({ bookings, tab, counts }: MyBookingsClientProps) {
  return (
    <div className="space-y-6">
      <div className="flex gap-1 border-b">
        {TABS.map((t) => (
          <a
            key={t.key}
            href={`/my-bookings?tab=${t.key}`}
            className={`relative px-4 pb-3 text-sm font-medium transition-colors ${
              tab === t.key
                ? "text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <span>{t.label}</span>
            <span className="ml-1.5 rounded-full bg-muted px-2 py-0.5 text-xs">
              {counts[t.key]}
            </span>
            {tab === t.key && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
            )}
          </a>
        ))}
      </div>

      {bookings.length === 0 ? (
        <div className="rounded-lg border border-dashed p-10 text-center text-muted-foreground">
          ไม่มีรายการจองในหมวดหมู่นี้
        </div>
      ) : (
        <div className="space-y-3">
          {bookings.map((booking) => (
            <BookingCard key={booking.id} booking={booking} />
          ))}
        </div>
      )}
    </div>
  );
}
