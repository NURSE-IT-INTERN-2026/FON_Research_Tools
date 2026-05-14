# Status Flow — Booking & Tool State Machines

---

## Booking Status

```
                    ┌──────────────────┐
                    │                  │
      borrower      │    PENDING       │
      submits       │                  │
  ─────────────►    └────────┬─────────┘
                             │
                    ┌────────┴─────────┐
                    │                  │
               ┌────▼─────┐     ┌─────▼─────┐
               │          │     │           │
               │ APPROVED │     │ REJECTED  │
               │          │     │           │
               └────┬─────┘     └───────────┘
                    │                ▲
                    │           borrower
                    │           cancels
                    │           (PENDING only)
                    │
              ┌─────┴──────┐
              │            │
         ┌────▼────┐  ┌───▼──────┐
         │         │  │          │
         │ RETURNED│  │ OVERDUE  │
         │         │  │          │
         └─────────┘  └────┬─────┘
                           │
                      admin marks
                       returned
                           │
                      ┌────▼─────┐
                      │          │
                      │ RETURNED │
                      │          │
                      └──────────┘
```

---

## Booking Status Transitions

| From | To | Triggered By | Side Effect |
|---|---|---|---|
| — | PENDING | Borrower submits request | — |
| PENDING | APPROVED | Admin approves | Tool → BORROWED |
| PENDING | REJECTED | Admin rejects | — |
| PENDING | REJECTED | Borrower cancels | — |
| APPROVED | RETURNED | Admin marks returned | Tool → AVAILABLE (if no other APPROVED bookings for that tool) |
| APPROVED | OVERDUE | Admin flags overdue | — |
| OVERDUE | RETURNED | Admin marks returned | Tool → AVAILABLE (if no other APPROVED bookings for that tool) |

### Immutable rules
- REJECTED and RETURNED are terminal states — no further transitions.
- Only PENDING bookings can be cancelled by the borrower.
- OVERDUE is set manually by admin (not auto-detected in MVP).

---

## Tool Status

```
  ┌────────────┐         ┌──────────┐
  │            │         │          │
  │ AVAILABLE  │◄────────┤ BORROWED │
  │            │         │          │
  └─────┬──────┘         └────▲─────┘
        │                     │
        │               booking
        │               approved
        │
  admin toggles
  maintenance
        │
  ┌─────▼──────┐
  │            │
  │MAINTENANCE │
  │            │
  └────────────┘
```

---

## Tool Status Transitions

| From | To | Triggered By | Condition |
|---|---|---|---|
| AVAILABLE | BORROWED | Booking approved | Tool has no other APPROVED bookings |
| BORROWED | AVAILABLE | Booking returned/rejected | No other APPROVED bookings exist for this tool |
| AVAILABLE | MAINTENANCE | Admin toggles | — |
| MAINTENANCE | AVAILABLE | Admin toggles | — |

### Rules
- BORROWED status is managed automatically via booking transitions — admin cannot set it manually.
- MAINTENANCE tools cannot be requested (treated as unavailable).
- A tool with multiple APPROVED bookings stays BORROWED until the last one is RETURNED.

---

## Tool Availability Check

When a booking is returned or rejected:

```
1. Update booking status to RETURNED or REJECTED
2. Check: does this tool have any other bookings with status APPROVED?
   - YES → tool stays BORROWED
   - NO  → set tool status to AVAILABLE
```

This prevents prematurely marking a tool as available when multiple active loans exist.

---

## Calendar Date Rules (Borrow Request Form)

- Start date: cannot be before today
- End date: cannot be before start date
- No overlap checking in MVP (same tool can have multiple APPROVED bookings — handled by trust/quantity)
