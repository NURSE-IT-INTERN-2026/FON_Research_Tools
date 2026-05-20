"use client";

import Image from "next/image";
import { useSearchParams } from "next/navigation";
import loginCmuImg from "@/../public/login_cmu.png";

const ERROR_MESSAGES: Record<string, string> = {
  oauth_error: "เกิดข้อผิดพลาดในการเข้าสู่ระบบ กรุณาลองใหม่",
  oauth_state_mismatch: "เกิดข้อผิดพลาดด้านความปลอดภัย กรุณาลองใหม่",
  oauth_token_failed: "ไม่สามารถยืนยันตัวตนกับระบบ CMU ได้ กรุณาลองใหม่",
  oauth_userinfo_failed: "ไม่สามารถดึงข้อมูลผู้ใช้ได้ กรุณาลองใหม่",
  not_allowed_faculty: "ระบบไม่รองรับบัญชีประเภทนี้",
};

export function LoginClient({ loginHref }: { loginHref: string }) {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  return (
    <>
      {error && (
        <div className="rounded border border-destructive/30 bg-destructive/8 px-4 py-3 text-sm text-destructive">
          {ERROR_MESSAGES[error] ?? "เกิดข้อผิดพลาด กรุณาลองใหม่"}
        </div>
      )}

      <a
        href={loginHref}
        className="flex items-center justify-center w-full"
      >
        <Image
          src={loginCmuImg}
          alt="เข้าสู่ระบบด้วย CMU Account"
          className="cursor-pointer hover:opacity-90 transition-opacity h-auto"
        />
      </a>

      <p className="text-center text-xs text-muted-foreground">
        สำหรับนักศึกษาและเจ้าหน้าที่ คณะพยาบาลศาสตร์ มหาวิทยาลัยเชียงใหม่
      </p>
    </>
  );
}
