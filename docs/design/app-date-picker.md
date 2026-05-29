# AppDatePicker — Design Specification

Reusable date picker component with Thai Buddhist calendar support, dual-tone theming, and popover calendar interface.

---

## Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `react-day-picker` | ^9.x | Calendar grid & navigation |
| `date-fns` | ^4.x | Thai locale (`th`) |
| `@radix-ui/react-popover` | ^1.x | Popover container |
| `lucide-react` | — | Calendar, chevron icons |

---

## Props API

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `value` | `string` | — | Controlled value (YYYY-MM-DD) |
| `defaultValue` | `string` | — | Uncontrolled initial value |
| `onChange` | `(value: string) => void` | — | Callback with YYYY-MM-DD string |
| `placeholder` | `string` | `"Select date"` | Placeholder text when empty |
| `error` | `string` | — | Error message (triggers red border) |
| `tone` | `"admin" \| "student"` | `"admin"` | Color theme |
| `size` | `"md" \| "lg"` | `"lg"` | Input height |
| `disabled` | `boolean` | `false` | Disable interaction |
| `required` | `boolean` | `false` | Mark hidden input as required |
| `startYear` | `number` | `1950` | Earliest selectable year |
| `endYear` | `number` | `currentYear + 5` | Latest selectable year |
| `id` | `string` | — | HTML id attribute |
| `name` | `string` | — | Hidden input name for form submission |
| `wrapperClassName` | `string` | — | Outer wrapper class |
| `className` | `string` | — | Trigger button class override |

### Value Format

- **Internal/onChange**: ISO date string `YYYY-MM-DD` (Gregorian calendar)
- **Display**: Thai Buddhist format via `Intl.DateTimeFormat("th-TH-u-ca-buddhist")` — e.g. `15 ม.ค. 2572`

---

## Visual Structure

```
┌─────────────────────────────────────────────────┐
│ 15 ม.ค. 2572                            📅     │  ← Trigger button
└─────────────────────────────────────────────────┘
                    │
                    ▼ (popover, sideOffset: 8px, align: start)
┌─────────────────────────────────────────────────┐
│  ◀   │  [เดือน ▼]  [ปี ▼]   │   ▶             │  ← Caption with dropdowns
├─────┬─────┬─────┬─────┬─────┬─────┬─────┬───────┤
│ อา  │ จ   │ อ   │ พ   │ พฤ  │ ศ   │ ส   │       │  ← Weekday headers
├─────┼─────┼─────┼─────┼─────┼─────┼─────┼───────┤
│     │  1  │  2  │  3  │  4  │  5  │  6  │  7    │
│  8  │  9  │ 10  │ 11  │ 12  │ 13  │ 14  │ 15    │
│ 16  │ 17  │ 18  │ 19  │ [20]│ 21  │ 22  │ 23    │  ← [selected]
│ 24  │ 25  │ 26  │ 27  │ 28  │ 29  │ 30  │ 31    │
└─────┴─────┴─────┴─────┴─────┴─────┴─────┴───────┘
```

---

## Sizing

| Size | Height | Padding | Font |
|------|--------|---------|------|
| `md` | 44px (`h-11`) | `px-4 pr-14` | `text-sm` |
| `lg` | 48px (`h-12`) | `px-4 pr-14` | `text-sm` |

---

## Color Themes

### Admin Tone (blue)

| Element | Style |
|---------|-------|
| **Border (idle)** | `border-slate-200` |
| **Border (focus)** | `border-admin/40` |
| **Ring (focus)** | `ring-admin/10` |
| **Icon bg** | `bg-admin/8` |
| **Icon text** | `text-admin` |
| **Icon ring** | `ring-admin/10` |
| **Popover border** | `border-admin/10` |
| **Nav buttons** | `text-admin` / `hover:bg-admin/8` |
| **Caption text** | `text-admin` |
| **Weekday text** | `text-slate-400` |
| **Dropdown border** | `border-admin/15` |
| **Dropdown bg** | `bg-admin/6` |
| **Dropdown text** | `text-admin` |
| **Selected day** | `bg-admin text-white` |
| **Today** | `border border-admin/25 text-admin` |
| **Hover** | `hover:bg-admin/8` |

### Student Tone (orange)

| Element | Style |
|---------|-------|
| **Border (idle)** | `border-slate-200` |
| **Border (focus)** | `border-orange-300` |
| **Ring (focus)** | `ring-orange-100` |
| **Icon bg** | `bg-orange-50` |
| **Icon text** | `text-orange-500` |
| **Icon ring** | `ring-orange-100` |
| **Popover border** | `border-orange-100/80` |
| **Nav buttons** | `text-orange-600` / `hover:bg-orange-50` |
| **Caption text** | `text-orange-700` |
| **Weekday text** | `text-orange-500/80` |
| **Dropdown border** | `border-orange-200` |
| **Dropdown bg** | `bg-orange-50/70` |
| **Dropdown text** | `text-orange-700` |
| **Selected day** | `bg-student text-white` |
| **Today** | `border border-orange-200 text-student` |
| **Hover** | `hover:bg-orange-50` |

### Error State (shared)

| Element | Style |
|---------|-------|
| **Border** | `border-red-200` |
| **Border (focus)** | `border-red-300` |
| **Ring (focus)** | `ring-red-100` |
| **Icon bg** | `bg-red-50` |
| **Icon text** | `text-red-500` |
| **Icon ring** | `ring-red-100` |

---

## Calendar Grid Specs

| Element | Style |
|---------|-------|
| **Popover** | `rounded-3xl border bg-white p-4 shadow-xl shadow-slate-900/10` |
| **Caption layout** | `dropdown` (month + year dropdowns) |
| **Dropdown height** | `h-9` |
| **Dropdown radius** | `rounded-xl` |
| **Month dropdown width** | `min-w-36` (144px) |
| **Year dropdown width** | `min-w-24` (96px) |
| **Nav buttons** | `h-8 w-8 rounded-xl`, positioned absolute left/right |
| **Weekday cells** | `h-9`, `text-xs`, `uppercase`, `tracking-[0.12em]` |
| **Day cells** | `h-10 w-10` |
| **Day buttons** | `h-10 w-10 rounded-2xl text-sm font-medium` |
| **Selected day** | Solid fill + white text |
| **Today** | Bordered (no fill) |
| **Outside days** | `text-slate-300` |
| **Grid gap** | `gap-1` (4px) |

---

## Thai Buddhist Calendar

### Year Conversion

Buddhist year = Gregorian year + 543

Uses `Intl.DateTimeFormat("th-TH-u-ca-buddhist", { year: "numeric" })` for automatic conversion.

### Month Labels

Uses `Intl.DateTimeFormat("th-TH", { month: "long" })` for Thai month names:

| # | Thai |
|---|------|
| 1 | มกราคม |
| 2 | กุมภาพันธ์ |
| 3 | มีนาคม |
| 4 | เมษายน |
| 5 | พฤษภาคม |
| 6 | มิถุนายน |
| 7 | กรกฎาคม |
| 8 | สิงหาคม |
| 9 | กันยายน |
| 10 | ตุลาคม |
| 11 | พฤศจิกายน |
| 12 | ธันวาคม |

### Weekday Headers

Source: `date-fns/locale/th` — abbreviated Thai day names: อา, จ, อ, พ, พฤ, ศ, ส

---

## Display Date Format

Input value `2026-01-15` renders as:

> **15 ม.ค. 2572**

Uses `Intl.DateTimeFormat("th-TH-u-ca-buddhist", { day: "2-digit", month: "short", year: "numeric" })`.

---

## Utility: Date Formatting

### `formatThaiDate(value, fallback)`

Formats any date input to Thai long format:

```
formatThaiDate("2026-01-15")  → "15 ม.ค. 2569"
formatThaiDate(null, "-")     → "-"
```

Uses `Intl.DateTimeFormat("th-TH", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Bangkok" })`.

### `formatThaiDateTime(value, fallback)`

Same as above but includes time:

```
formatThaiDateTime("2026-01-15T14:30:00")  → "15 ม.ค. 2569, 14:30"
```

Uses 24-hour format (`hour12: false`).

---

## Behavior

1. **Controlled**: Pass `value` + `onChange` — component does not manage internal state
2. **Uncontrolled**: Pass `defaultValue` (or nothing) — component manages state internally
3. **Form submission**: Pass `name` to render a hidden `<input>` with the ISO value
4. **Selection**: Clicking a day calls `onChange` and closes the popover
5. **Validation**: `error` prop toggles red border styling; `required` marks the hidden input

---

## Usage Examples

### Basic (uncontrolled)

```tsx
<AppDatePicker
  name="dateOfBirth"
  placeholder="เลือกวันเกิด"
  startYear={1970}
  endYear={2010}
/>
```

### Controlled with state

```tsx
const [date, setDate] = useState("");

<AppDatePicker
  value={date}
  onChange={setDate}
  tone="student"
  startYear={2024}
  endYear={2026}
/>
```

### With validation

```tsx
<AppDatePicker
  name="startDate"
  required
  error={errors.startDate}
  tone="admin"
  size="md"
  placeholder="วันเริ่มฝึกงาน"
/>
```

### Date range filter

```tsx
const [start, setStart] = useState("");
const [end, setEnd] = useState("");

<AppDatePicker
  value={start}
  onChange={setStart}
  tone="admin"
  size="md"
  placeholder="จากวันที่"
  startYear={currentYear - 3}
  endYear={currentYear + 1}
/>
<AppDatePicker
  value={end}
  onChange={setEnd}
  tone="admin"
  size="md"
  placeholder="ถึงวันที่"
  startYear={currentYear - 3}
  endYear={currentYear + 1}
/>
```

---

## File Structure (Reference)

```
src/
├── components/ui/
│   └── app-date-picker.tsx    # Main component
└── lib/
    └── date-format.ts         # formatThaiDate, formatThaiDateTime utilities
```

---

## Accessibility

- Calendar icon uses `aria-hidden="true"`
- Trigger button is focusable with keyboard
- DayPicker provides built-in keyboard navigation (arrow keys, Enter, Escape)
- Focus ring visible on all interactive elements
- `data-invalid` attribute set on trigger for CSS targeting
