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
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Image src="/nurse_logo.svg" alt="Research Tools" width={24} height={24} />
            <span className="text-lg font-semibold">Research Tools</span>
          </div>
          <CardTitle className="text-2xl">เข้าสู่ระบบ</CardTitle>
          <CardDescription>
            กรอกอีเมลและรหัสผ่านเพื่อเข้าสู่ระบบ
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
              <Label htmlFor="email">อีเมล</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="example@email.com"
                defaultValue={state.email ?? ""}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">รหัสผ่าน</Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="รหัสผ่าน"
                required
              />
            </div>

            <Button type="submit" className="w-full" disabled={pending}>
              {pending ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
            </Button>
          </form>

          <p className="mt-4 text-center text-sm text-muted-foreground">
            ยังไม่มีบัญชี?{" "}
            <Link href="/signup" className="text-primary hover:underline">
              สมัครใช้งาน
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
