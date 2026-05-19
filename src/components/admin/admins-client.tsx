"use client";

import { useActionState, useEffect, useState } from "react";
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
import { createAdmin, type CreateAdminState } from "@/actions/admin-actions";
import { Plus } from "lucide-react";

type AdminRow = {
  id: string;
  name: string;
  email: string;
  createdAt: Date | string;
};

function AddAdminModal({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [state, formAction, pending] = useActionState(
    createAdmin,
    {} as CreateAdminState,
  );

  useEffect(() => {
    if (state.success) {
      onOpenChange(false);
      toast.success("สร้างบัญชีผู้ดูแลระบบสำเร็จ");
    }
  }, [state.success, onOpenChange]);

  useEffect(() => {
    if (state.error) toast.error(state.error);
  }, [state.error]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md rounded">
        <DialogHeader>
          <DialogTitle className="font-heading font-bold tracking-tight">
            เพิ่มผู้ดูแลระบบ
          </DialogTitle>
          <DialogDescription>เพิ่มบัญชีผู้ดูแลระบบใหม่</DialogDescription>
        </DialogHeader>
        <form action={formAction} className="grid gap-4 py-2">
          <div className="space-y-2">
            <Label
              htmlFor="admin-name"
              className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
            >
              ชื่อ-นามสกุล *
            </Label>
            <Input id="admin-name" name="name" required className="rounded" />
          </div>
          <div className="space-y-2">
            <Label
              htmlFor="admin-email"
              className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
            >
              อีเมล *
            </Label>
            <Input
              id="admin-email"
              name="email"
              type="email"
              required
              className="rounded"
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="rounded"
            >
              ยกเลิก
            </Button>
            <Button
              type="submit"
              disabled={pending}
              className="rounded font-semibold"
            >
              {pending ? "กำลังสร้าง..." : "สร้างบัญชี"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function AdminsClient({ admins }: { admins: AdminRow[] }) {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button
          onClick={() => setModalOpen(true)}
          className="rounded font-semibold"
        >
          <Plus className="mr-1.5 h-4 w-4" />
          เพิ่มผู้ดูแลระบบ
        </Button>
      </div>

      <AddAdminModal
        key={modalOpen ? "open" : "closed"}
        open={modalOpen}
        onOpenChange={setModalOpen}
      />

      {admins.length === 0 ? (
        <div className="rounded border border-dashed p-10 text-center text-muted-foreground">
          ยังไม่มีผู้ดูแลระบบ
        </div>
      ) : (
        <div className="overflow-x-auto rounded border bg-card">
          <table className="w-full min-w-135 text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 text-left font-heading font-semibold text-xs uppercase tracking-wider text-muted-foreground">
                  ชื่อ
                </th>
                <th className="px-4 py-3 text-left font-heading font-semibold text-xs uppercase tracking-wider text-muted-foreground">
                  อีเมล
                </th>
              </tr>
            </thead>
            <tbody>
              {admins.map((admin) => (
                <tr
                  key={admin.id}
                  className="border-t transition-colors hover:bg-muted/30"
                >
                  <td className="px-4 py-3 font-medium">{admin.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {admin.email}
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
