import { Suspense } from "react";
import { LoginClient } from "./login-client";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
const LOGIN_HREF = `${basePath}/api/auth/cmu`;

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-4 relative">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
        <div className="absolute bottom-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
      </div>

      <div className="w-full max-w-md relative z-10 rounded border bg-card text-card-foreground shadow animate-slide-up">
        <div className="h-[3px] bg-primary rounded-t" />
        <div className="flex flex-col space-y-1.5 p-6 text-center pt-6">
          <div className="flex items-center justify-center gap-2.5 mb-3">
            <div className="flex h-8 w-8 items-center justify-center rounded bg-primary">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/nurse_logo.svg`} alt="" width={16} height={16} className="brightness-0 invert" />
            </div>
            <span className="font-heading font-bold text-sm tracking-widest uppercase">Research Tools</span>
          </div>
          <h2 className="font-heading text-2xl font-bold tracking-tight">เข้าสู่ระบบ</h2>
          <p className="text-sm text-muted-foreground">
            เข้าสู่ระบบด้วย CMU Account
          </p>
        </div>
        <div className="p-6 pt-0 space-y-4">
          <Suspense>
            <LoginClient loginHref={LOGIN_HREF} />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
