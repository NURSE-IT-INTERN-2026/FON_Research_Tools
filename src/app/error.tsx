"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="flex flex-col items-center gap-6 text-center max-w-md">
        <span className="font-heading text-5xl font-bold text-destructive/30">Error</span>
        <h1 className="font-heading text-xl font-bold tracking-tight">เกิดข้อผิดพลาด</h1>
        <p className="text-muted-foreground text-sm">
          เกิดข้อผิดพลาดที่ไม่คาดคิด กรุณาลองใหม่อีกครั้ง
        </p>
        <Button onClick={reset} variant="outline" className="font-semibold">
          ลองใหม่
        </Button>
      </div>
    </div>
  );
}
