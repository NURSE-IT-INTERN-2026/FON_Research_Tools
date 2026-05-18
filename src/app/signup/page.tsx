"use client";

import { useActionState } from "react";
import Link from "next/link";
import { signup, type SignupState } from "@/actions/signup";
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

export default function SignupPage() {
  const [state, formAction, pending] = useActionState(signup, {} as SignupState);

  return (
    <div className="flex min-h-screen items-center justify-center p-4 relative">
      {/* Geometric background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-0.5 bg-linear-to-r from-transparent via-primary/20 to-transparent" />
        <div className="absolute bottom-0 left-0 w-full h-0.5 bg-linear-to-r from-transparent via-primary/20 to-transparent" />
      </div>

      <Card className="w-full max-w-md relative z-10 rounded border animate-slide-up">
        <div className="h-0.75 bg-primary rounded-t" />
        <CardHeader className="text-center pt-6">
          <div className="flex items-center justify-center gap-2.5 mb-3">
            <div className="flex h-8 w-8 items-center justify-center rounded bg-primary">
              <Image src="/nurse_logo.svg" alt="" width={16} height={16} className="brightness-0 invert" />
            </div>
            <span className="font-heading font-bold text-sm tracking-widest uppercase">Research Tools</span>
          </div>
          <CardTitle className="font-heading text-2xl font-bold tracking-tight">สร้างบัญชีของคุณ</CardTitle>
          <CardDescription>
            กรอกข้อมูลเพื่อสมัครใช้งานระบบยืมคืนอุปกรณ์
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
              <Label htmlFor="name" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">ชื่อ-นามสกุล</Label>
              <Input
                id="name"
                name="name"
                placeholder="สมชาย ใจดี"
                required
                className="rounded"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">อีเมล</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="example@email.com"
                required
                className="rounded"
              />
            </div>

            <input type="hidden" name="department" value="คณะพยาบาลศาสตร์" />

            <div className="space-y-2">
              <Label htmlFor="password" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">รหัสผ่าน</Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="อย่างน้อย 6 ตัวอักษร"
                minLength={6}
                required
                className="rounded"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">บทบาท</Label>
              <div className="grid grid-cols-2 gap-3">
                <label
                  className="flex cursor-pointer flex-col items-center gap-1.5 rounded border-2 border-muted p-3 transition-all has-[:checked]:border-primary has-[:checked]:bg-primary/5 has-[:checked]:shadow-none hover:border-foreground/20"
                  htmlFor="role-borrower"
                >
                  <input
                    type="radio"
                    id="role-borrower"
                    name="role"
                    value="BORROWER"
                    className="sr-only"
                    defaultChecked
                  />
                  <span className="text-sm font-heading font-semibold">ผู้ยืม</span>
                  <span className="text-xs text-muted-foreground">
                    ยืมและติดตามอุปกรณ์
                  </span>
                </label>
                <label
                  className="flex cursor-pointer flex-col items-center gap-1.5 rounded border-2 border-muted p-3 transition-all has-[:checked]:border-primary has-[:checked]:bg-primary/5 has-[:checked]:shadow-none hover:border-foreground/20"
                  htmlFor="role-admin"
                >
                  <input
                    type="radio"
                    id="role-admin"
                    name="role"
                    value="ADMIN"
                    className="sr-only"
                  />
                  <span className="text-sm font-heading font-semibold">ผู้ดูแลระบบ</span>
                  <span className="text-xs text-muted-foreground">
                    จัดการอุปกรณ์และคำขอ
                  </span>
                </label>
              </div>
            </div>

            <Button type="submit" className="w-full font-heading font-semibold tracking-wide rounded" disabled={pending}>
              {pending ? "กำลังสมัคร..." : "สมัครใช้งาน"}
            </Button>
          </form>

          <p className="mt-5 text-center text-sm text-muted-foreground">
            มีบัญชีอยู่แล้ว?{" "}
            <Link href="/login" className="font-semibold text-primary hover:underline underline-offset-4">
              เข้าสู่ระบบ
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
