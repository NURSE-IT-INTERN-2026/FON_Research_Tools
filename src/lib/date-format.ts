const THAI_DATE = new Intl.DateTimeFormat("th-TH", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "Asia/Bangkok",
});

const THAI_DATETIME = new Intl.DateTimeFormat("th-TH", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
  timeZone: "Asia/Bangkok",
});

const THAI_SHORT = new Intl.DateTimeFormat("th-TH-u-ca-buddhist", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

export function formatThaiDate(value: string | null | undefined, fallback = "-"): string {
  if (!value) return fallback;
  const d = new Date(value);
  if (isNaN(d.getTime())) return fallback;
  return THAI_DATE.format(d);
}

export function formatThaiDateTime(value: string | null | undefined, fallback = "-"): string {
  if (!value) return fallback;
  const d = new Date(value);
  if (isNaN(d.getTime())) return fallback;
  return THAI_DATETIME.format(d);
}

export function formatThaiShort(value: string): string {
  const d = new Date(value);
  if (isNaN(d.getTime())) return value;
  return THAI_SHORT.format(d);
}
