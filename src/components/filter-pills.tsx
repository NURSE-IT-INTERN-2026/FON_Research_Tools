"use client";

import { useRouter, useSearchParams } from "next/navigation";

type FilterPillsProps = {
  paramName: string;
  options: { label: string; value: string }[];
  selected: string;
};

export function FilterPills({ paramName, options, selected }: FilterPillsProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function select(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "ALL") {
      params.delete(paramName);
    } else {
      params.set(paramName, value);
    }
    router.push(`/dashboard?${params.toString()}`);
  }

  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => {
        const isActive = selected === opt.value;
        return (
          <button
            key={opt.value}
            onClick={() => select(opt.value)}
            className={`rounded-full px-3 py-1 text-xs font-medium border transition-colors ${
              isActive
                ? "bg-primary text-primary-foreground border-primary"
                : "border-input bg-background hover:bg-accent hover:text-accent-foreground"
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
