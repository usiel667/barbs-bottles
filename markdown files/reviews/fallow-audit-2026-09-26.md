# Fallow Audit Report — 2026-09-26

**Branch:** `customer-detail-page`
**Scope:** `audit` against `main` (changed files only — customer detail page, `customers/page.tsx`, `OrderRow.tsx`, new queries/constants)
**Verdict:** ✅ pass (after refactor) — 0 findings introduced by this branch
**Status:** Findings addressed; remaining findings are all pre-existing

---

## Run history

| Run | Verdict | Introduced | Notes |
|-----|---------|-----------|-------|
| 1 — before refactor | ❌ fail | 2 complexity | `CustomerDetailPage` was one 204-line function |
| 2 — after split into components | ✅ pass | 0 | max cyclomatic 9 (pre-existing code) |

### Run 1 — what failed
| Function | Cyclomatic | CRAP (limit 30) | Severity |
|----------|-----------|-----------------|----------|
| `CustomerDetailPage` (`customers/[id]/page.tsx`) | 12 | 156 | critical |
| inner order-row map in the same file | 5 | 30 | moderate |

Cyclomatic complexity was well under the limit (20) — the failures were CRAP scores. fallow assumes 0% test coverage here (repo has no tests), so CRAP = CC² + CC, and any function with cyclomatic ≥ 5 hits the threshold of 30.

### Fix
Split the page into `CustomerDetailsCard.tsx` and `CustomerOrdersCard.tsx`, each composed of small single-purpose components (`ContactField`, `ActiveBadge`, `PersonalInfoSection`, `AddressSection`, `AdditionalInfoSection`, `OrderStatusBadge`, `OrderTableRow`, `OrdersTable`, `OrderMobileCard`, `OrdersMobileList`, `OrdersEmptyState`), with tiny formatting helpers pulling the ternaries out of the JSX. `page.tsx` is now just header + two cards.

---

## Final state (run 2)

| Category | Result |
|----------|--------|
| Introduced by this branch | **0** |
| Duplication | 0 clone groups (0% of 6,226 lines) |
| Unused files / exports / types | 0 |
| Circular deps / boundary violations | 0 |

### Pre-existing complexity findings (4, none new)
| Where | Cyclomatic | CRAP | Severity |
|-------|-----------|------|----------|
| `customers/page.tsx` — desktop row map (line 71) | 9 | 90 | high |
| `customers/page.tsx` — mobile card map (line 165) | 7 | 56 | high |
| `orders/OrderRow.tsx` — `OrderRow` | 6 | 42 | moderate |
| `orders/OrderRow.tsx` — inner map (line 97) | 5 | 30 | moderate |

The same two-map / `OrderRow` shape could be split the same way if wanted.

### Unused dependencies (8, unchanged since [[fallow-audit-2026-08-02]])
`@hookform/resolvers`, `@kinde/management-api-js`, `@radix-ui/react-checkbox`, `@radix-ui/react-dropdown-menu`, `@radix-ui/react-label`, `@radix-ui/react-select`, `@radix-ui/react-tabs`, `react-hook-form`

---

## Notes / follow-ups
- The global search bar files (already on `main`) were not part of this diff, so they were not audited in this run.
- `lib/utils.ts` has unused `formatDate` / `formatPrice` (flagged 2026-08-02) that overlap with helpers defined in `CustomerOrdersCard.tsx` — reusing them would also clear two of the earlier unused-export findings.
