import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="flex flex-col items-center gap-6 text-center max-w-md">
        <Image src="/nurse_logo.svg" alt="Research Tools" width={48} height={48} />
        <h1 className="text-4xl font-bold tracking-tight">Research Tools</h1>
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
