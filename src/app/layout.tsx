import type { Metadata } from "next";
import { Sarabun } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const sarabun = Sarabun({
  variable: "--font-sarabun",
  subsets: ["latin", "thai"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "ToolLend — ระบบยืมคืนอุปกรณ์",
  description: "ระบบจัดการยืมคืนอุปกรณ์วิจัย",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th" className={`${sarabun.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-[family-name:var(--font-sarabun)]">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
