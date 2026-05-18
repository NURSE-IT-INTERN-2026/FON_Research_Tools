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
import { Plus, Copy, Check } from "lucide-react";

type AdminRow = {
  id: string;
  name: string;
  email: string;
  department: string | null;
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
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (state.error) toast.error(state.error);
  }, [state.error]);

  const handleCopy = () => {
    if (state.generatedPassword) {
      navigator.clipboard.writeText(state.generatedPassword);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (state.success && state.generatedPassword) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md rounded">
          <DialogHeader>
            <DialogTitle className="font-heading font-bold tracking-tight">
              สร้างบัญชีสำเร็จ
            </DialogTitle>
            <DialogDescription>
              รหัสผ่านจะแสดงเพียงครั้งเดียว กรุณาบันทึกไว้
            </DialogDescription>
          </DialogHeader>
          <div className="rounded border bg-muted/50 p-4">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              รหัสผ่าน
            </Label>
            <div className="mt-1 flex items-center gap-2">
              <code className="flex-1 font-mono text-sm font-bold select-all">
                {state.generatedPassword}
              </code>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopy}
                className="rounded"
              >
                {copied ? (
                  <Check className="h-3.5 w-3.5" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
              </Button>
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={() => onOpenChange(false)}
              className="rounded font-semibold"
            >
              ปิด
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md rounded">
        <DialogHeader>
          <DialogTitle className="font-heading font-bold tracking-tight">
            เพิ่มผู้ดูแลระบบ
          </DialogTitle>
          <DialogDescription>ระบบจะสร้างรหัสผ่านอัตโนมัติ</DialogDescription>
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
                <th className="px-4 py-3 text-left font-heading font-semibold text-xs uppercase tracking-wider text-muted-foreground">
                  แผนก
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
                  <td className="px-4 py-3 text-muted-foreground">
                    {admin.department ?? "—"}
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
