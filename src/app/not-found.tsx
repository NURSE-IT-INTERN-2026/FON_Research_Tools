import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="flex flex-col items-center gap-6 text-center max-w-md">
        <span className="font-heading text-7xl font-bold text-muted-foreground/30">404</span>
        <h1 className="font-heading text-2xl font-bold tracking-tight">ไม่พบหน้าที่ต้องการ</h1>
        <p className="text-muted-foreground">
          หน้าที่คุณกำลังมองหาอาจถูกย้ายหรือไม่มีอยู่
        </p>
        <Button asChild className="font-semibold">
          <Link href="/">กลับหน้าหลัก</Link>
        </Button>
      </div>
    </div>
  );
}
