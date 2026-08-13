import { Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import cmuLogo from "@/../public/cmu_logo.png";
import { OAuthError } from "./oauth-error";
import { isLocalAdminLoginEnabled } from "@/lib/auth/admin-credentials";

const LOGIN_HREF = `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/api/auth/cmu`;

export default function HomePage() {
  const showAdminLogin = isLocalAdminLoginEnabled();
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 relative">
      {/* Geometric background accents */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
        <div className="absolute bottom-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
        <div className="absolute top-1/4 -left-32 w-64 h-64 border border-primary/5 rotate-45" />
        <div className="absolute bottom-1/4 -right-32 w-64 h-64 border border-primary/5 rotate-12" />
      </div>

      <div className="flex flex-col items-center gap-8 text-center max-w-lg relative z-10">
        <div className="animate-fade-in">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={`${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/nurse_logo.svg`} alt="Research Tools" width={56} height={56} />
        </div>

        <div className="animate-slide-up space-y-3">
          <h1 className="font-heading text-5xl font-bold tracking-tight leading-none">
            RESEARCH<br />TOOLS
          </h1>
          <div className="mx-auto w-12 h-[3px] bg-primary" />
        </div>

        <p className="text-muted-foreground max-w-sm animate-slide-up text-base leading-relaxed" style={{ animationDelay: "100ms" }}>
          ระบบจัดการยืมเครื่องมือและอุปกรณ์เพื่องานวิจัย<br />
          คณะพยาบาลศาสตร์ มหาวิทยาลัยเชียงใหม่
        </p>

        <Suspense>
          <OAuthError />
        </Suspense>

        <div className="flex flex-col sm:flex-row gap-3 animate-slide-up" style={{ animationDelay: "200ms" }}>
          <a
            href={LOGIN_HREF}
            className="inline-flex items-center justify-center gap-2.5 bg-purple-600 hover:bg-purple-700 text-white font-heading font-semibold tracking-wide px-8 h-11 rounded-md transition-colors"
          >
            <Image src={cmuLogo} alt="CMU" height={24} className="h-6 w-auto" />
            เข้าสู่ระบบด้วย CMU Account
          </a>
          {showAdminLogin && (
            <Button asChild variant="outline" size="lg" className="font-heading font-semibold tracking-wide px-8">
              <Link href="/admin/login">เข้าสู่ระบบเจ้าหน้าที่</Link>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
