"use client";

import { useActionState } from "react";
import { adminLogin, type AdminLoginState } from "@/actions/admin-auth-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LogIn } from "lucide-react";

export function AdminLoginClient() {
  const [state, formAction, pending] = useActionState(adminLogin, {
    error: undefined,
  } as AdminLoginState);

  return (
    <form action={formAction} className="space-y-4">
      {state.error && (
        <div className="rounded border border-destructive/30 bg-destructive/8 px-4 py-3 text-sm text-destructive">
          {state.error}
        </div>
      )}

      <div className="space-y-2">
        <Label
          htmlFor="username"
          className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
        >
          ชื่อผู้ใช้
        </Label>
        <Input
          id="username"
          name="username"
          required
          autoComplete="username"
          placeholder="username"
          className="rounded"
        />
      </div>

      <div className="space-y-2">
        <Label
          htmlFor="password"
          className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
        >
          รหัสผ่าน
        </Label>
        <Input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          placeholder="••••••••"
          className="rounded"
        />
      </div>

      <Button
        type="submit"
        disabled={pending}
        className="w-full rounded font-semibold"
      >
        <LogIn className="mr-1.5 h-4 w-4" />
        {pending ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
      </Button>
    </form>
  );
}
