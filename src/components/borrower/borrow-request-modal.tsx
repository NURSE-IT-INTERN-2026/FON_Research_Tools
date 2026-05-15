"use client";

import { useActionState, useEffect } from "react";
import { createBooking, type CreateBookingState } from "@/actions/create-booking";
import type { ToolCardData } from "@/components/tool-card";
import { StatusBadge } from "@/components/status-badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { MapPin } from "lucide-react";
import { toast } from "sonner";

type BorrowRequestModalProps = {
  tool: ToolCardData | null;
  open: boolean;
  onClose: () => void;
};

export function BorrowRequestModal({
  tool,
  open,
  onClose,
}: BorrowRequestModalProps) {
  const [state, formAction, pending] = useActionState(createBooking, {} as CreateBookingState);

  useEffect(() => {
    if (state.success) {
      toast.success("ส่งคำขอยืมสำเร็จ");
      onClose();
    }
  }, [state.success, onClose]);

  if (!tool) return null;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>ยืมอุปกรณ์</DialogTitle>
        </DialogHeader>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-3">
            <div className="rounded-xl border bg-muted/50 p-4 space-y-2">
              <div className="flex items-start justify-between">
                <h3 className="font-semibold">{tool.name}</h3>
                <StatusBadge status={tool.status} />
              </div>
              <p className="text-xs font-medium text-primary">{tool.category}</p>
              {tool.description && (
                <p className="text-sm text-muted-foreground">{tool.description}</p>
              )}
              {tool.location && (
                <p className="flex items-center gap-1 text-xs text-muted-foreground">
                  <MapPin className="h-3 w-3" />
                  {tool.location}
                </p>
              )}
            </div>
          </div>

          <form action={formAction} className="space-y-4">
            <input type="hidden" name="toolId" value={tool.id} />

            {state.error && (
              <div className="rounded-md bg-destructive/15 px-4 py-3 text-sm text-destructive">
                {state.error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="startDate">วันที่เริ่มต้น</Label>
              <Input
                id="startDate"
                name="startDate"
                type="date"
                required
                min={new Date().toISOString().split("T")[0]}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="endDate">วันที่สิ้นสุด</Label>
              <Input
                id="endDate"
                name="endDate"
                type="date"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="purpose">วัตถุประสงค์</Label>
              <Textarea
                id="purpose"
                name="purpose"
                placeholder="ระบุวัตถุประสงค์ในการยืม"
                rows={3}
                required
              />
            </div>

            <Button type="submit" className="w-full" disabled={pending}>
              {pending ? "กำลังส่ง..." : "ส่งคำขอยืม"}
            </Button>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
