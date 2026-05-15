"use client";

import { useRouter, useSearchParams } from "next/navigation";

type FilterPillsProps = {
  paramName: string;
  options: { label: string; value: string }[];
  selected: string;
  basePath?: string;
};

export function FilterPills({ paramName, options, selected, basePath = "/dashboard" }: FilterPillsProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function select(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "ALL") {
      params.delete(paramName);
    } else {
      params.set(paramName, value);
    }
    router.push(`${basePath}?${params.toString()}`);
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((opt) => {
        const isActive = selected === opt.value;
        return (
          <button
            key={opt.value}
            onClick={() => select(opt.value)}
            className={`rounded px-3 py-1.5 text-xs font-medium border transition-all duration-150 ${
              isActive
                ? "bg-primary text-primary-foreground border-primary font-semibold"
                : "border-border bg-background hover:border-foreground/20 hover:bg-muted text-muted-foreground"
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
