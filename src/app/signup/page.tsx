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
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Image src="/nurse_logo.svg" alt="Research Tools" width={24} height={24} />
            <span className="text-lg font-semibold">Research Tools</span>
          </div>
          <CardTitle className="text-2xl">สร้างบัญชีของคุณ</CardTitle>
          <CardDescription>
            กรอกข้อมูลเพื่อสมัครใช้งานระบบยืมคืนอุปกรณ์
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={formAction} className="space-y-4">
            {state.error && (
              <div className="rounded-md bg-destructive/15 px-4 py-3 text-sm text-destructive">
                {state.error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="name">ชื่อ-นามสกุล</Label>
              <Input
                id="name"
                name="name"
                placeholder="สมชาย ใจดี"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">อีเมล</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="example@email.com"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="department">แผนก (ไม่จำเป็น)</Label>
              <Input
                id="department"
                name="department"
                placeholder="วิศวกรรมศาสตร์"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">รหัสผ่าน</Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="อย่างน้อย 6 ตัวอักษร"
                minLength={6}
                required
              />
            </div>

            <div className="space-y-2">
              <Label>บทบาท</Label>
              <div className="grid grid-cols-2 gap-3">
                <label
                  className="flex cursor-pointer flex-col items-center gap-1 rounded-lg border-2 border-muted p-3 transition-colors has-[:checked]:border-primary has-[:checked]:bg-primary/5"
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
                  <span className="text-sm font-medium">ผู้ยืม</span>
                  <span className="text-xs text-muted-foreground">
                    ยืมและติดตามอุปกรณ์
                  </span>
                </label>
                <label
                  className="flex cursor-pointer flex-col items-center gap-1 rounded-lg border-2 border-muted p-3 transition-colors has-[:checked]:border-primary has-[:checked]:bg-primary/5"
                  htmlFor="role-admin"
                >
                  <input
                    type="radio"
                    id="role-admin"
                    name="role"
                    value="ADMIN"
                    className="sr-only"
                  />
                  <span className="text-sm font-medium">ผู้ดูแลระบบ</span>
                  <span className="text-xs text-muted-foreground">
                    จัดการอุปกรณ์และคำขอ
                  </span>
                </label>
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={pending}>
              {pending ? "กำลังสมัคร..." : "สมัครใช้งาน"}
            </Button>
          </form>

          <p className="mt-4 text-center text-sm text-muted-foreground">
            มีบัญชีอยู่แล้ว?{" "}
            <Link href="/login" className="text-primary hover:underline">
              เข้าสู่ระบบ
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
