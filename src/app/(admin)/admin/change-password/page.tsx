import { ChangePasswordForm } from "@/components/change-password-form";

export default function ChangePasswordPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold tracking-tight heading-accent">
          เปลี่ยนรหัสผ่าน
        </h1>
        <p className="text-muted-foreground mt-3">
          เปลี่ยนรหัสผ่านของบัญชีคุณ
        </p>
      </div>
      <ChangePasswordForm />
    </div>
  );
}
