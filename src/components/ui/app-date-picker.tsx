"use client";

import { useState, useId } from "react";
import {
  DayPicker,
  type MonthCaptionProps,
  useDayPicker,
} from "react-day-picker";
import { th } from "date-fns/locale/th";
import { format, parseISO } from "date-fns";
import { CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { formatThaiShort } from "@/lib/date-format";

type Tone = "admin" | "student";

type AppDatePickerProps = {
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  error?: string;
  tone?: Tone;
  size?: "md" | "lg";
  disabled?: boolean;
  required?: boolean;
  startYear?: number;
  endYear?: number;
  id?: string;
  name?: string;
  wrapperClassName?: string;
  className?: string;
};

const TONE_STYLES: Record<Tone, { selected: string; today: string; hover: string; icon: string; nav: string; caption: string; weekday: string; dropdown: string }> = {
  admin: {
    selected: "bg-primary text-primary-foreground",
    today: "border border-primary/25 text-primary",
    hover: "hover:bg-accent",
    icon: "text-primary bg-accent",
    nav: "text-primary hover:bg-accent",
    caption: "text-primary",
    weekday: "text-muted-foreground",
    dropdown: "border-primary/15 bg-accent text-primary",
  },
  student: {
    selected: "bg-primary text-primary-foreground",
    today: "border border-primary/25 text-primary",
    hover: "hover:bg-accent",
    icon: "text-primary bg-accent",
    nav: "text-primary hover:bg-accent",
    caption: "text-primary",
    weekday: "text-muted-foreground",
    dropdown: "border-primary/15 bg-accent text-primary",
  },
};

const SIZE_MAP = { md: "h-9", lg: "h-10" };

function Caption({ calendarMonth }: MonthCaptionProps) {
  const { goToMonth } = useDayPicker();
  const date = calendarMonth.date;
  const year = date.getFullYear();
  const monthIndex = date.getMonth();
  const currentYear = new Date().getFullYear();

  const months = Array.from({ length: 12 }, (_, i) => th.localize?.month(i as 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11, { width: "abbreviated" }) ?? "");
  const fromYear = 1950;
  const toYear = currentYear + 5;
  const years = Array.from({ length: toYear - fromYear + 1 }, (_, i) => fromYear + i);

  return (
    <div className="flex items-center justify-between px-1 pb-2">
      <button
        type="button"
        onClick={() => goToMonth(new Date(year, monthIndex - 1, 1))}
        className="inline-flex h-8 w-8 items-center justify-center rounded-xl text-muted-foreground hover:bg-accent transition-colors"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
      <div className="flex items-center gap-1">
        <select
          value={monthIndex}
          onChange={(e) => goToMonth(new Date(year, Number(e.target.value), 1))}
          className={cn("h-9 rounded-xl border px-2 text-sm min-w-36", "border-primary/15 bg-accent text-primary")}
        >
          {months.map((m, i) => (
            <option key={i} value={i}>{m}</option>
          ))}
        </select>
        <select
          value={year}
          onChange={(e) => goToMonth(new Date(Number(e.target.value), monthIndex, 1))}
          className={cn("h-9 rounded-xl border px-2 text-sm min-w-24", "border-primary/15 bg-accent text-primary")}
        >
          {years.map((y) => (
            <option key={y} value={y}>
              {y + 543}
            </option>
          ))}
        </select>
      </div>
      <button
        type="button"
        onClick={() => goToMonth(new Date(year, monthIndex + 1, 1))}
        className="inline-flex h-8 w-8 items-center justify-center rounded-xl text-muted-foreground hover:bg-accent transition-colors"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
}

export function AppDatePicker({
  value,
  defaultValue,
  onChange,
  placeholder = "เลือกวันที่",
  error,
  tone = "admin",
  size = "lg",
  disabled = false,
  required = false,
  startYear = 1950,
  endYear: endYearProp,
  id: idProp,
  name,
  wrapperClassName,
  className,
}: AppDatePickerProps) {
  const generatedId = useId();
  const id = idProp ?? generatedId;
  const [open, setOpen] = useState(false);
  const [internalDate, setInternalDate] = useState(defaultValue ? parseISO(defaultValue) : undefined);

  const isControlled = value !== undefined;
  const selectedDate = isControlled ? (value ? parseISO(value) : undefined) : internalDate;
  const endYear = endYearProp ?? new Date().getFullYear() + 5;
  const ts = TONE_STYLES[tone];

  const handleSelect = (date: Date | undefined) => {
    if (disabled) return;
    if (!isControlled) setInternalDate(date);
    onChange?.(date ? format(date, "yyyy-MM-dd") : "");
    setOpen(false);
  };

  const displayValue = selectedDate ? formatThaiShort(format(selectedDate, "yyyy-MM-dd")) : "";

  return (
    <div className={cn("relative", wrapperClassName)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            id={id}
            disabled={disabled}
            data-invalid={!!error}
            className={cn(
              "flex w-full items-center justify-between rounded-md border border-input bg-background px-3 text-sm shadow-xs transition-colors",
              "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
              "disabled:cursor-not-allowed disabled:opacity-50",
              error ? "border-red-200 focus-visible:border-red-300 focus-visible:ring-red-100" : "",
              SIZE_MAP[size],
              className,
            )}
          >
            <span className={cn("truncate", !displayValue && "text-muted-foreground")}>
              {displayValue || placeholder}
            </span>
            <span
              className={cn(
                "ml-2 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg",
                error ? "bg-red-50 text-red-500" : ts.icon,
              )}
            >
              <CalendarIcon className="h-4 w-4" aria-hidden="true" />
            </span>
          </button>
        </PopoverTrigger>
        <PopoverContent
          sideOffset={8}
          align="start"
          className="rounded-3xl border bg-card p-4 shadow-xl w-auto"
        >
          <DayPicker
            mode="single"
            selected={selectedDate}
            onSelect={handleSelect}
            locale={th}
            defaultMonth={selectedDate ?? new Date()}
            fromYear={startYear}
            toYear={endYear}
            captionLayout="label"
            components={{ MonthCaption: Caption }}
            classNames={{
              month: "space-y-2",
              months: "flex flex-col",
              weekday: cn("h-9 text-xs uppercase tracking-[0.12em]", ts.weekday),
              day: "h-10 w-10",
              day_button: cn("h-10 w-10 rounded-2xl text-sm font-medium transition-colors", ts.hover),
              selected: cn("rounded-2xl", ts.selected),
              today: cn("rounded-2xl", ts.today),
              outside: "text-muted-foreground/40",
              month_grid: "gap-1",
            }}
            formatters={{
              formatMonthDropdown: (date) => format(date, "MMMM", { locale: th }),
              formatYearDropdown: (date) => String(date.getFullYear() + 543),
            }}
          />
        </PopoverContent>
      </Popover>
      {name && (
        <input type="hidden" name={name} value={value ?? (selectedDate ? format(selectedDate, "yyyy-MM-dd") : "")} required={required} />
      )}
    </div>
  );
}
