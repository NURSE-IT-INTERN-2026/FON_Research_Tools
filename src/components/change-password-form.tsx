"use client";

import { useActionState, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  changePassword,
  type ChangePasswordState,
} from "@/actions/change-password";

export function ChangePasswordForm() {
  const [state, formAction, pending] = useActionState(
    changePassword,
    {} as ChangePasswordState,
  );

  useEffect(() => {
    if (state.success) toast.success("เปลี่ยนรหัสผ่านสำเร็จ");
  }, [state.success]);

  useEffect(() => {
    if (state.error) toast.error(state.error);
  }, [state.error]);

  return (
    <Card className="max-w-md rounded border">
      <CardContent className="pt-6">
        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label
              htmlFor="currentPassword"
              className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
            >
              รหัสผ่านปัจจุบัน
            </Label>
            <Input
              id="currentPassword"
              name="currentPassword"
              type="password"
              required
              className="rounded"
            />
          </div>
          <div className="space-y-2">
            <Label
              htmlFor="newPassword"
              className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
            >
              รหัสผ่านใหม่
            </Label>
            <Input
              id="newPassword"
              name="newPassword"
              type="password"
              placeholder="อย่างน้อย 6 ตัวอักษร"
              minLength={6}
              required
              className="rounded"
            />
          </div>
          <div className="space-y-2">
            <Label
              htmlFor="confirmPassword"
              className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
            >
              ยืนยันรหัสผ่านใหม่
            </Label>
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              minLength={6}
              required
              className="rounded"
            />
          </div>
          <Button
            type="submit"
            disabled={pending}
            className="w-full rounded font-semibold"
          >
            {pending ? "กำลังบันทึก..." : "เปลี่ยนรหัสผ่าน"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
