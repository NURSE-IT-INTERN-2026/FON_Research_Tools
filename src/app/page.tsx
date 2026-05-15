import Link from "next/link";
import { Microscope } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="flex flex-col items-center gap-6 text-center max-w-md">
        <Microscope className="h-12 w-12 text-primary" />
        <h1 className="text-4xl font-bold tracking-tight">ToolLend</h1>
        <p className="text-muted-foreground">
          ระบบจัดการยืมคืนอุปกรณ์วิจัย สำหรับนักวิจัยและผู้ดูแลห้องปฏิบัติการ
        </p>
        <div className="flex gap-3">
          <Button asChild>
            <Link href="/login">เข้าสู่ระบบ</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/signup">สมัครใช้งาน</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
