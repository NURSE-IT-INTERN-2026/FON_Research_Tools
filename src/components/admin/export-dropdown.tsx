"use client";

import { useState, useRef, useEffect } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export function ExportDropdown({ status, query }: { status: string; query: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function buildUrl(format: string) {
    const params = new URLSearchParams();
    params.set("format", format);
    if (status && status !== "ALL") params.set("status", status);
    if (query) params.set("q", query);
    return `${BASE_PATH}/api/documents/export?${params.toString()}`;
  }

  return (
    <div ref={ref} className="relative">
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setOpen(!open)}
        className="rounded gap-1.5"
      >
        <Download className="h-4 w-4" />
        ส่งออก
      </Button>
      {open && (
        <div className="absolute right-0 top-full mt-1 z-50 rounded-lg border bg-card shadow-lg py-1 min-w-40">
          <a
            href={buildUrl("xlsx")}
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-muted transition-colors"
          >
            <Download className="h-3.5 w-3.5" />
            Excel (.xlsx)
          </a>
          <a
            href={buildUrl("csv")}
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-muted transition-colors"
          >
            <Download className="h-3.5 w-3.5" />
            CSV (.csv)
          </a>
        </div>
      )}
    </div>
  );
}
