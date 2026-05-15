"use client";

import { useActionState } from "react";
import Link from "next/link";
import { login, type LoginState } from "@/actions/login";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Image from "next/image";

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(login, {} as LoginState);

  return (
    <div className="flex min-h-screen items-center justify-center p-4 relative">
      {/* Geometric background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
        <div className="absolute bottom-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
      </div>

      <Card className="w-full max-w-md relative z-10 rounded border animate-slide-up">
        <div className="h-[3px] bg-primary rounded-t" />
        <CardHeader className="text-center pt-6">
          <div className="flex items-center justify-center gap-2.5 mb-3">
            <div className="flex h-8 w-8 items-center justify-center rounded bg-primary">
              <Image src="/nurse_logo.svg" alt="" width={16} height={16} className="brightness-0 invert" />
            </div>
            <span className="font-heading font-bold text-sm tracking-widest uppercase">Research Tools</span>
          </div>
          <CardTitle className="font-heading text-2xl font-bold tracking-tight">เข้าสู่ระบบ</CardTitle>
          <CardDescription className="text-muted-foreground">
            กรอกอีเมลและรหัสผ่านเพื่อเข้าสู่ระบบ
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={formAction} className="space-y-4">
            {state.error && (
              <div className="rounded border border-destructive/30 bg-destructive/8 px-4 py-3 text-sm text-destructive">
                {state.error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">อีเมล</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="example@email.com"
                defaultValue={state.email ?? ""}
                required
                className="rounded"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">รหัสผ่าน</Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="รหัสผ่าน"
                required
                className="rounded"
              />
            </div>

            <Button type="submit" className="w-full font-heading font-semibold tracking-wide rounded" disabled={pending}>
              {pending ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
            </Button>
          </form>

          <p className="mt-5 text-center text-sm text-muted-foreground">
            ยังไม่มีบัญชี?{" "}
            <Link href="/signup" className="font-semibold text-primary hover:underline underline-offset-4">
              สมัครใช้งาน
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
