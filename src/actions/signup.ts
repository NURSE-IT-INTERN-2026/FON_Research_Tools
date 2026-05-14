"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export type SignupState = {
  error?: string;
};

export async function signup(
  _prev: SignupState,
  formData: FormData,
): Promise<SignupState> {
  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const department = formData.get("department") as string;
  const role = formData.get("role") as string;

  if (!name || !email || !password || !role) {
    return { error: "กรุณากรอกข้อมูลให้ครบถ้วน" };
  }

  if (password.length < 6) {
    return { error: "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร" };
  }

  if (role !== "ADMIN" && role !== "BORROWER") {
    return { error: "กรุณาเลือกบทบาท" };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { name, department: department || null, role },
    },
  });

  if (error) {
    return { error: "อีเมลนี้ถูกใช้งานแล้ว หรือข้อมูลไม่ถูกต้อง" };
  }

  // GoTrue MAILER_AUTOCONFIRM=true → session returned in signUp response.
  if (data.session) {
    redirect(role === "ADMIN" ? "/admin/dashboard" : "/dashboard");
  }

  redirect("/login");
}
