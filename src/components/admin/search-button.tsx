"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Search, Users, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { searchAll, type SearchResult } from "@/actions/search-actions";

export function SearchButton() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const doSearch = useCallback(async (q: string) => {
    if (!q.trim()) {
      setResults([]);
      return;
    }
    setLoading(true);
    try {
      const data = await searchAll(q);
      setResults(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => doSearch(query), 300);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [query, doSearch]);

  function handleSelect(result: SearchResult) {
    setOpen(false);
    setQuery("");
    setResults([]);
    if (result.type === "student") {
      router.push("/admin/students");
    } else {
      router.push("/admin/documents");
    }
  }

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setOpen(true)}
        className="relative rounded"
        aria-label="ค้นหา"
      >
        <Search className="h-5 w-5" />
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent showCloseButton={false} className="sm:max-w-lg rounded p-0 gap-0 overflow-hidden">
          <DialogTitle className="sr-only">ค้นหา</DialogTitle>
          <DialogDescription className="sr-only">
            ค้นหานักศึกษาหรือเอกสารเครื่องมือวิจัย
          </DialogDescription>
          <div className="flex items-center border-b px-4">
            <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="ค้นหาจากรหัสนักศึกษา, ชื่อ, ชื่อเครื่องมือวิจัย..."
              className="border-0 focus-visible:ring-0 px-3 h-12 text-sm"
              autoFocus
            />
          </div>
          <div className="max-h-80 overflow-y-auto">
            {query.trim() && !loading && results.length === 0 && (
              <p className="px-4 py-6 text-center text-sm text-muted-foreground">
                ไม่พบผลลัพธ์
              </p>
            )}
            {results.map((result) => (
              <button
                key={`${result.type}-${result.id}`}
                onClick={() => handleSelect(result)}
                className="flex items-center gap-3 w-full px-4 py-3 text-left hover:bg-muted/50 transition-colors"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-muted text-muted-foreground">
                  {result.type === "student" ? (
                    <Users className="h-4 w-4" />
                  ) : (
                    <FileText className="h-4 w-4" />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{result.label}</p>
                  {result.sublabel && (
                    <p className="text-xs text-muted-foreground truncate">
                      {result.type === "student" ? result.sublabel : `นักศึกษา: ${result.sublabel}`}
                    </p>
                  )}
                </div>
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
