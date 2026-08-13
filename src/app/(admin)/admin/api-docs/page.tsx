import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { KeyRound, UserCog, GraduationCap, Mail, Info } from "lucide-react";

const OAUTH_ERRORS: { code: string; meaning: string }[] = [
  {
    code: "oauth_error",
    meaning: "เกิดข้อผิดพลาดหรือถูกยกเลิกจาก Microsoft ให้ลองเข้าสู่ระบบใหม่",
  },
  {
    code: "oauth_state_mismatch",
    meaning: "การยืนยันตัวตนไม่ผ่าน (มาตรการป้องกันการโจมตี) ให้ลองใหม่อีกครั้ง",
  },
  {
    code: "oauth_token_failed",
    meaning: "แลกรหัสเป็น token ไม่สำเร็จ อาจเป็นปัญหาที่บริการ CMU ชั่วคราว",
  },
  {
    code: "oauth_userinfo_failed",
    meaning: "ดึงข้อมูลผู้ใช้จาก CMU ไม่สำเร็จ ให้ลองใหม่หรือติดต่อผู้ดูแลระบบ",
  },
];

export default function ApiDocsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold tracking-tight heading-accent">
          คู่มือ API
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          สรุประบบ API ภายนอกที่ระบบจัดการยืมเครื่องมือและอุปกรณ์เพื่องานวิจัยเชื่อมต่อ
        </p>
      </div>

      <div className="flex items-start gap-3 rounded-lg border border-border bg-muted/40 p-4">
        <Info className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
        <p className="text-sm leading-relaxed text-muted-foreground">
          หน้านี้ช่วยให้เจ้าหน้าที่เข้าใจว่าข้อมูลแต่ละส่วนมาจาก API ใด
          เมื่อเกิดปัญหาจะได้ระบุต้นทางได้ถูกต้อง
          (หน้านี้ไม่แสดงข้อมูลลับ เช่น รหัสผ่านหรือ token)
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* CMU OAuth */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <KeyRound className="h-5 w-5" />
              </span>
              <div>
                <CardTitle>CMU OAuth 2.0 — ระบบล็อกอิน</CardTitle>
                <CardDescription>ล็อกอินผ่านบัญชี CMU (Microsoft Entra ID)</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p>
              <span className="font-medium">หน้าที่:</span> ใช้บัญชี CMU Account
              ในการเข้าสู่ระบบ โดยมหาวิทยาลัยเป็นผู้ยืนยันตัวตน
            </p>
            <p>
              <span className="font-medium">เส้นทางในระบบ:</span>{" "}
              <code className="rounded bg-muted px-1.5 py-0.5">/api/auth/cmu</code>{" "}
              (เริ่มล็อกอิน) ·{" "}
              <code className="rounded bg-muted px-1.5 py-0.5">/api/auth/callback</code>{" "}
              (รับผลลัพธ์)
            </p>
            <p>
              <span className="font-medium">ขั้นตอน:</span> กดเข้าสู่ระบบ →
              กรอกบัญชี CMU → แลกรหัสเป็น token → ดึงข้อมูลผู้ใช้ → สร้างเซสชัน
            </p>
            <div>
              <p className="font-medium">รหัสข้อผิดพลาดที่อาจพบ:</p>
              <table className="mt-2 w-full border-collapse text-xs">
                <tbody>
                  {OAUTH_ERRORS.map((e) => (
                    <tr key={e.code} className="border-b border-border last:border-0">
                      <td className="py-1.5 pr-3 align-top">
                        <code className="rounded bg-muted px-1.5 py-0.5">{e.code}</code>
                      </td>
                      <td className="py-1.5 text-muted-foreground">{e.meaning}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* CMU MIS API */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <UserCog className="h-5 w-5" />
              </span>
              <div>
                <CardTitle>CMU MIS API — ข้อมูลผู้ใช้</CardTitle>
                <CardDescription>ดึงข้อมูลผู้ใช้หลังล็อกอินสำเร็จ</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p>
              <span className="font-medium">หน้าที่:</span> ดึงข้อมูลผู้ใช้จากระบบกลางของมหาวิทยาลัย
              หลังยืนยันตัวตนผ่าน OAuth
            </p>
            <div>
              <p className="font-medium">ข้อมูลที่ได้รับ:</p>
              <ul className="mt-1 list-disc space-y-1 pl-5 text-muted-foreground">
                <li>ชื่อ-นามสกุล (ไทย/อังกฤษ)</li>
                <li>อีเมลและรหัสนักศึกษา</li>
                <li>คณะ/หน่วยงาน และประเภทบัญชี</li>
              </ul>
            </div>
            <p>
              <span className="font-medium">วิธีใช้ในระบบ:</span> นำข้อมูลมาสร้าง/อัปเดตโปรไฟล์
              และกำหนดบทบาท (นักศึกษา/เจ้าหน้าที่)
            </p>
            <p className="text-muted-foreground">
              หมายเหตุ: ระบบไม่เก็บ access token ของ CMU หลังดึงข้อมูลเสร็จ
            </p>
          </CardContent>
        </Card>

        {/* Thesis API */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <GraduationCap className="h-5 w-5" />
              </span>
              <div>
                <CardTitle>Thesis API — วิทยานิพนธ์และรายชื่อนักศึกษา</CardTitle>
                <CardDescription>ดึงข้อมูลวิทยานิพนธ์และรายชื่อนักศึกษา</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div>
              <p className="font-medium">การใช้งาน 2 กรณี:</p>
              <ul className="mt-1 list-disc space-y-1 pl-5 text-muted-foreground">
                <li>
                  แสดงข้อมูลวิทยานิพนธ์ของนักศึกษาแต่ละคน — ดึงทุกครั้งที่แสดงผล
                  (ไม่เก็บในระบบ)
                </li>
                <li>
                  นำเข้ารายชื่อนักศึกษาทั้งหมด — ปุ่ม &ldquo;sync&rdquo; ในหน้ารายชื่อนักศึกษา
                </li>
              </ul>
            </div>
            <p>
              <span className="font-medium">ข้อมูล:</span> ชื่อวิทยานิพนธ์ (ไทย/อังกฤษ),
              สาขา, ระดับปริญญา, หลักสูตร, บัญชี CMU
            </p>
            <p>
              <span className="font-medium">การตรวจสอบคณะ:</span> ระบบอนุญาตเฉพาะนักศึกษา
              ที่สาขา (major_th) มีคำว่า &ldquo;พยาบาล&rdquo;
            </p>
          </CardContent>
        </Card>

        {/* Email API */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Mail className="h-5 w-5" />
              </span>
              <div>
                <CardTitle>CMU Email API — อีเมลแจ้งเตือน</CardTitle>
                <CardDescription>ส่งอีเมลแจ้งเตือนอัตโนมัติ</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div>
              <p className="font-medium">กรณีที่ส่งอีเมล:</p>
              <ul className="mt-1 list-disc space-y-1 pl-5 text-muted-foreground">
                <li>นักศึกษาอัปโหลดเอกสาร → แจ้งเจ้าหน้าที่</li>
                <li>เจ้าหน้าที่อนุมัติ/ปฏิเสธเอกสาร → แจ้งนักศึกษา</li>
              </ul>
            </div>
            <p>
              <span className="font-medium">ขั้นตอน:</span> ขอ token (GetToken) →
              ส่งอีเมล (SendEmail)
            </p>
            <p className="text-muted-foreground">
              หมายเหตุ: รองรับผู้รับทั้งอีเมล CMU และอีเมลภายนอก (เช่น Gmail)
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
