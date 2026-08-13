import type { Metadata } from "next";
import { Sarabun, Chakra_Petch } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const sarabun = Sarabun({
  variable: "--font-sarabun",
  subsets: ["latin", "thai"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800"],
});

const chakraPetch = Chakra_Petch({
  variable: "--font-chakra-petch",
  subsets: ["latin", "thai"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Research Tools — ระบบจัดการยืมเครื่องมือและอุปกรณ์เพื่องานวิจัย",
  description:
    "ระบบจัดการยืมเครื่องมือและอุปกรณ์เพื่องานวิจัย คณะพยาบาลศาสตร์ มหาวิทยาลัยเชียงใหม่",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th" className={`${sarabun.variable} ${chakraPetch.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-[family-name:var(--font-sarabun)]">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
