"use client";

import { useSearchParams } from "next/navigation";

const ERROR_MESSAGES: Record<string, string> = {
  oauth_error: "เกิดข้อผิดพลาดในการเข้าสู่ระบบ กรุณาลองใหม่",
  oauth_state_mismatch: "เกิดข้อผิดพลาดด้านความปลอดภัย กรุณาลองใหม่",
  oauth_token_failed: "ไม่สามารถยืนยันตัวตนกับระบบ CMU ได้ กรุณาลองใหม่",
  oauth_userinfo_failed: "ไม่สามารถดึงข้อมูลผู้ใช้ได้ กรุณาลองใหม่",
  not_allowed_faculty: "ระบบไม่รองรับบัญชีประเภทนี้",
};

export function OAuthError() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  if (!error) return null;

  return (
    <div className="rounded border border-destructive/30 bg-destructive/8 px-4 py-3 text-sm text-destructive animate-slide-up">
      {ERROR_MESSAGES[error] ?? "เกิดข้อผิดพลาด กรุณาลองใหม่"}
    </div>
  );
}
