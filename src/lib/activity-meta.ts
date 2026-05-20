import {
  FilePlus,
  CheckCircle,
  XCircle,
  Trash2,
  UserPlus,
  LogIn,
  type LucideIcon,
} from "lucide-react";

export const ACTION_LABELS: Record<string, string> = {
  USER_LOGIN: "เข้าสู่ระบบ",
  DOCUMENT_UPLOAD: "อัปโหลดเอกสาร",
  DOCUMENT_APPROVE: "อนุมัติเอกสาร",
  DOCUMENT_REJECT: "ปฏิเสธเอกสาร",
  DOCUMENT_REMOVE: "ลบเอกสาร",
  ADMIN_CREATED: "เพิ่มผู้ดูแลระบบ",
};

export const ACTION_ICONS: Record<string, LucideIcon> = {
  USER_LOGIN: LogIn,
  DOCUMENT_UPLOAD: FilePlus,
  DOCUMENT_APPROVE: CheckCircle,
  DOCUMENT_REJECT: XCircle,
  DOCUMENT_REMOVE: Trash2,
  ADMIN_CREATED: UserPlus,
};

export const ACTION_OPTIONS = [
  { label: "ทั้งหมด", value: "ALL" },
  ...Object.entries(ACTION_LABELS).map(([value, label]) => ({ label, value })),
];

export const TARGET_OPTIONS = [
  { label: "ทั้งหมด", value: "ALL" },
  { label: "เอกสาร", value: "Document" },
  { label: "ผู้ใช้", value: "Profile" },
];

export const ACTION_COLORS: Record<string, string> = {
  USER_LOGIN: "text-slate-600 bg-slate-50",
  DOCUMENT_UPLOAD: "text-blue-600 bg-blue-50",
  DOCUMENT_APPROVE: "text-emerald-600 bg-emerald-50",
  DOCUMENT_REJECT: "text-red-600 bg-red-50",
  DOCUMENT_REMOVE: "text-amber-600 bg-amber-50",
  ADMIN_CREATED: "text-indigo-600 bg-indigo-50",
};
