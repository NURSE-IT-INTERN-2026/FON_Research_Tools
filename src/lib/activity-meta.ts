import {
  FilePlus,
  CheckCircle,
  XCircle,
  RotateCcw,
  AlertTriangle,
  Ban,
  Plus,
  Pencil,
  Trash2,
  ToggleLeft,
  UserPlus,
  LogIn,
  KeyRound,
  type LucideIcon,
} from "lucide-react";

export const ACTION_LABELS: Record<string, string> = {
  BOOKING_CREATE: "สร้างคำขอยืม",
  BOOKING_APPROVE: "อนุมัติคำขอยืม",
  BOOKING_REJECT: "ปฏิเสธคำขอยืม",
  BOOKING_RETURN: "บันทึกการคืน",
  BOOKING_OVERDUE: "ตั้งค่าเกินกำหนด",
  BOOKING_CANCEL: "ยกเลิกคำขอยืม",
  TOOL_CREATE: "เพิ่มอุปกรณ์",
  TOOL_UPDATE: "แก้ไขอุปกรณ์",
  TOOL_DEACTIVATE: "ปิดใช้งานอุปกรณ์",
  TOOL_TOGGLE_STATUS: "เปลี่ยนสถานะอุปกรณ์",
  USER_SIGNUP: "ลงทะเบียน",
  USER_LOGIN: "เข้าสู่ระบบ",
  ADMIN_CREATED: "เพิ่มผู้ดูแลระบบ",
  PASSWORD_CHANGED: "เปลี่ยนรหัสผ่าน",
};

export const ACTION_ICONS: Record<string, LucideIcon> = {
  BOOKING_CREATE: FilePlus,
  BOOKING_APPROVE: CheckCircle,
  BOOKING_REJECT: XCircle,
  BOOKING_RETURN: RotateCcw,
  BOOKING_OVERDUE: AlertTriangle,
  BOOKING_CANCEL: Ban,
  TOOL_CREATE: Plus,
  TOOL_UPDATE: Pencil,
  TOOL_DEACTIVATE: Trash2,
  TOOL_TOGGLE_STATUS: ToggleLeft,
  USER_SIGNUP: UserPlus,
  USER_LOGIN: LogIn,
  ADMIN_CREATED: UserPlus,
  PASSWORD_CHANGED: KeyRound,
};

export const ACTION_OPTIONS = [
  { label: "ทั้งหมด", value: "ALL" },
  ...Object.entries(ACTION_LABELS).map(([value, label]) => ({ label, value })),
];

export const TARGET_OPTIONS = [
  { label: "ทั้งหมด", value: "ALL" },
  { label: "การยืม", value: "Booking" },
  { label: "อุปกรณ์", value: "Tool" },
  { label: "ผู้ใช้", value: "Profile" },
];

export const ACTION_COLORS: Record<string, string> = {
  BOOKING_CREATE: "text-blue-600 bg-blue-50",
  BOOKING_APPROVE: "text-emerald-600 bg-emerald-50",
  BOOKING_REJECT: "text-red-600 bg-red-50",
  BOOKING_RETURN: "text-slate-600 bg-slate-50",
  BOOKING_OVERDUE: "text-red-600 bg-red-50",
  BOOKING_CANCEL: "text-amber-600 bg-amber-50",
  TOOL_CREATE: "text-emerald-600 bg-emerald-50",
  TOOL_UPDATE: "text-blue-600 bg-blue-50",
  TOOL_DEACTIVATE: "text-slate-600 bg-slate-50",
  TOOL_TOGGLE_STATUS: "text-amber-600 bg-amber-50",
  USER_SIGNUP: "text-purple-600 bg-purple-50",
  USER_LOGIN: "text-slate-600 bg-slate-50",
  ADMIN_CREATED: "text-indigo-600 bg-indigo-50",
  PASSWORD_CHANGED: "text-teal-600 bg-teal-50",
};
