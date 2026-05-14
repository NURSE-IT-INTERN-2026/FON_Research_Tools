# UI Style Guide — Lovable Reference Project

> Extracted from `src/styles.css` and component code. Documents the visual language used.

---

## Color System

**Base:** OKLCH color space, Tailwind v4 CSS variables.
**shadcn config:** new-york style, slate base color, CSS variables enabled.

### Default Theme (Borrower / Orange)

| Token | OKLCH | Approximate | Usage |
|---|---|---|---|
| `--background` | `oklch(0.985 0.002 50)` | Near-white warm gray | Page background |
| `--foreground` | `oklch(0.22 0.01 50)` | Very dark gray (~#333) | Primary text |
| `--card` | `oklch(1 0 0)` | Pure white | Card backgrounds |
| `--card-foreground` | `oklch(0.22 0.01 50)` | Same as foreground | Card text |
| `--popover` | `oklch(1 0 0)` | Pure white | Popover bg |
| `--primary` | `oklch(0.685 0.175 45)` | **Orange (~#f26e2c)** | Buttons, active states, links |
| `--primary-foreground` | `oklch(0.99 0 0)` | White | Text on primary bg |
| `--secondary` | `oklch(0.955 0.004 50)` | Light warm gray | Secondary bg |
| `--muted` | `oklch(0.955 0.004 50)` | Light warm gray | Muted bg, empty states |
| `--muted-foreground` | `oklch(0.5 0.01 50)` | Medium gray | Secondary text |
| `--accent` | `oklch(0.96 0.03 45)` | Light peach | Hover states |
| `--accent-foreground` | `oklch(0.4 0.15 45)` | Dark orange | Text on accent |
| `--destructive` | `oklch(0.58 0.22 27)` | Red | Error/delete states |
| `--destructive-foreground` | `oklch(0.99 0 0)` | White | Text on destructive |
| `--success` | `oklch(0.66 0.16 150)` | Green | Available/Approved status |
| `--success-foreground` | `oklch(0.99 0 0)` | White | Text on success |
| `--warning` | `oklch(0.685 0.175 45)` | **Same as primary orange** | Pending status (admin) |
| `--warning-foreground` | `oklch(0.99 0 0)` | White | Text on warning |
| `--border` | `oklch(0.91 0.005 50)` | Light border gray | Borders |
| `--input` | `oklch(0.91 0.005 50)` | Light border gray | Input borders |
| `--ring` | `oklch(0.685 0.175 45)` | Orange | Focus rings |
| `--sidebar` | `oklch(0.22 0.005 50)` | **Dark charcoal** | Sidebar background |
| `--sidebar-foreground` | `oklch(0.96 0.005 50)` | Light gray | Sidebar text |
| `--sidebar-accent` | `oklch(0.685 0.175 45)` | Orange | Sidebar active/hover |
| `--sidebar-border` | `oklch(0.3 0.005 50)` | Dark border | Sidebar dividers |
| `--radius` | `0.625rem` | 10px | Base border radius |

### Admin Theme (Purple) — Applied via `.admin-theme` class on layout root

| Token | OKLCH | Approximate | Overrides |
|---|---|---|---|
| `--primary` | `oklch(0.62 0.09 330)` | **Purple/mauve (~#aa74ab)** | Buttons, active states |
| `--accent` | `oklch(0.95 0.025 330)` | Light lavender | Hover states |
| `--accent-foreground` | `oklch(0.4 0.1 330)` | Dark purple | Text on accent |
| `--ring` | `oklch(0.62 0.09 330)` | Purple | Focus rings |
| `--sidebar` | `oklch(0.62 0.09 330)` | Purple | Sidebar background |
| `--sidebar-foreground` | `oklch(0.99 0 0)` | White | Sidebar text |
| `--sidebar-accent` | `oklch(0.52 0.11 330)` | Darker purple | Sidebar active |
| `--sidebar-border` | `oklch(0.55 0.1 330)` | Medium purple | Sidebar dividers |

**Key difference:** Admin pages get purple buttons, purple sidebar, purple focus rings. The `--background`, `--card`, `--border`, `--success`, `--destructive` tokens remain the same.

---

## Typography

- **Font stack:** `ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif` (system default)
- **Page titles:** `text-2xl font-semibold tracking-tight`
- **Section headings:** `text-lg font-semibold`
- **Card titles:** `font-semibold leading-tight`
- **Body text:** `text-sm`
- **Labels:** `text-sm font-medium`
- **Small/meta text:** `text-xs text-muted-foreground`
- **Filter labels:** `text-xs font-medium text-muted-foreground uppercase tracking-wide`
- **404:** `text-7xl font-bold`

---

## Spacing & Layout Patterns

- **Page padding:** `p-6 md:p-10` inside main content area
- **Max content width:** `max-w-6xl mx-auto`
- **Sidebar width:** `w-64` (256px fixed)
- **Card padding:** `p-4` to `p-8` depending on context
- **Section gaps:** `mb-6` (between header and content), `mt-6` to `mt-8` (between sections)
- **Grid gaps:** `gap-4` (stat cards), `gap-5` (tool cards, form fields)

---

## Border Radius

- Base: `--radius: 0.625rem` (10px)
- Cards/containers: `rounded-xl` (12px)
- Buttons: `rounded-md` (6px)
- Badges/pills: `rounded-full`
- Sidebar nav items: `rounded-md`
- Images in cards: `rounded-lg`

---

## Status Badge Pattern

All status badges follow the same structure:
```
inline-flex rounded-full px-2-2.5 py-0.5 text-xs font-medium border
```

Colors use the `bg-{token}/15 text-{token} border-{token}/30` pattern (15% opacity background, 30% opacity border).

### Booking Status Colors

| Status | Bg | Text | Border |
|---|---|---|---|
| PENDING (borrower) | primary/15 | primary | primary/30 |
| PENDING (admin) | warning/15 | warning-foreground | warning/40 |
| APPROVED | success/15 | success | success/30 |
| REJECTED | destructive/15 | destructive | destructive/30 |
| RETURNED | muted | muted-foreground | border |
| OVERDUE | destructive/15 | destructive | destructive/30 |

### Tool Status Colors

| Status | Bg | Text | Border |
|---|---|---|---|
| AVAILABLE | success/15 | success | success/30 |
| BORROWED | primary/15 | primary | primary/30 |
| MAINTENANCE | muted | muted-foreground | border |

---

## Button Styles

| Variant | Classes |
|---|---|
| Primary | `rounded-md bg-primary text-primary-foreground px-{3-5} py-{1.5-2} text-xs/sm font-medium hover:opacity-90` |
| Outline | `rounded-md border border-input bg-background/card px-3-4 py-1.5-2 text-xs/sm hover:bg-accent` |
| Destructive | `text-destructive` on icon buttons |
| Disabled | `disabled:opacity-50-60 disabled:cursor-not-allowed` |

---

## Filter Pill Pattern

Used in: tool catalog (category + status), admin requests (status filter)

```
px-3 py-1 rounded-full text-xs border transition-colors
```
- Active: `bg-primary text-primary-foreground border-primary`
- Inactive: `border-input bg-background hover:bg-accent`

---

## Table Pattern

Used in: inventory, requests, users

```
overflow-x-auto rounded-xl border border-border bg-card
table.w-full.text-sm
thead.bg-muted/50.text-left → th.px-4.py-3.font-medium
tbody → tr.border-t.border-border → td.px-4.py-3
```

---

## Modal / Dialog Pattern

- Fixed overlay: `fixed inset-0 z-50 bg-black/50-60 flex items-center justify-center p-4`
- Modal card: `bg-card rounded-xl border border-border w-full max-w-{lg|2xl} shadow-xl`
- Click overlay to dismiss
- Header: `flex justify-between p-5 border-b border-border`
- Footer: `flex justify-end gap-2 p-5 border-t border-border bg-muted/30`

---

## Empty State Pattern

```
rounded-lg border border-dashed border-border p-10-12 text-center text-sm text-muted-foreground
```

---

## Card (Stat) Pattern

```
rounded-xl border border-border bg-card p-5 hover:shadow-md transition-shadow
```
- Icon container: `rounded-lg bg-primary/10 text-primary p-2`
- Value: `text-2xl font-semibold tracking-tight`
- Label: `text-xs text-muted-foreground`

---

## Input Field Pattern

```
w-full rounded-md border border-input bg-background px-3 py-2 text-sm
focus:outline-none focus:ring-2 focus:ring-ring
```
No shadcn `<Input>` component is used — all inputs are raw HTML with these classes.

---

## Toast Notifications

- Library: Sonner
- Position: top-right
- Config: `richColors` enabled
- Usage: `toast.success(...)`, `toast.error(...)` throughout
