import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function UnauthorizedPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 relative">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
        <div className="absolute bottom-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
      </div>

      <div className="flex flex-col items-center gap-6 text-center max-w-md relative z-10">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
          <span className="text-3xl font-heading font-bold text-destructive">!</span>
        </div>
        <h1 className="font-heading text-2xl font-bold tracking-tight">ไม่สามารถเข้าถึงได้</h1>
        <p className="text-muted-foreground leading-relaxed">
          ระบบไม่รองรับบัญชีประเภทนี้<br />
          กรุณาติดต่อเจ้าหน้าที่หากมีข้อสงสัย
        </p>
        <Button asChild className="font-semibold">
          <Link href="/login">กลับหน้าเข้าสู่ระบบ</Link>
        </Button>
      </div>
    </div>
  );
}
