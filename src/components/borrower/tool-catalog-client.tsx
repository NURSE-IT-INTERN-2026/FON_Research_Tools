"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { FilterPills } from "@/components/filter-pills";
import { ToolCard, type ToolCardData } from "@/components/tool-card";

const STATUS_OPTIONS = [
  { label: "ทั้งหมด", value: "ALL" },
  { label: "พร้อมใช้งาน", value: "AVAILABLE" },
  { label: "กำลังยืม", value: "BORROWED" },
  { label: "ซ่อมบำรุง", value: "MAINTENANCE" },
];

type ToolCatalogClientProps = {
  tools: ToolCardData[];
  categories: string[];
  filters: {
    q: string;
    category: string;
    status: string;
  };
};

function SearchBar({ initialQuery }: { initialQuery: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(initialQuery);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    if (query) {
      params.set("q", query);
    } else {
      params.delete("q");
    }
    router.push(`/dashboard?${params.toString()}`);
  }

  return (
    <form onSubmit={handleSubmit} className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input
        type="search"
        placeholder="ค้นหาอุปกรณ์..."
        className="pl-9"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
    </form>
  );
}

export function ToolCatalogClient({
  tools,
  categories,
  filters,
}: ToolCatalogClientProps) {
  const categoryOptions = [
    { label: "ทั้งหมด", value: "ALL" },
    ...categories.map((c) => ({ label: c, value: c })),
  ];

  return (
    <div className="space-y-6">
      <div className="rounded-xl border bg-card p-4 space-y-4">
        <Suspense>
          <SearchBar initialQuery={filters.q} />
        </Suspense>
        <div className="flex flex-wrap items-start gap-6">
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground">หมวดหมู่</p>
            <FilterPills
              paramName="category"
              options={categoryOptions}
              selected={filters.category || "ALL"}
            />
          </div>
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground">สถานะ</p>
            <FilterPills
              paramName="status"
              options={STATUS_OPTIONS}
              selected={filters.status || "ALL"}
            />
          </div>
        </div>
      </div>

      {tools.length === 0 ? (
        <div className="rounded-lg border border-dashed p-10 text-center text-muted-foreground">
          ไม่พบอุปกรณ์ที่ตรงกับเงื่อนไข
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {tools.map((tool) => (
            <ToolCard key={tool.id} tool={tool} />
          ))}
        </div>
      )}
    </div>
  );
}
