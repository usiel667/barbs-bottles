# Fallow Audit Report — 2026-06-06

**Branch:** `orders-page-revamp` vs `main`  
**Verdict:** FAIL  
**Changed files analyzed:** 22  
**Fixes applied:** `fallow-audit-fixes` branch (2026-06-12)

---

## Complexity — 8 findings (6 introduced by this branch)

| Severity | Function | File | Cyclomatic | CRAP | Introduced | Status |
|----------|----------|------|-----------|------|------------|--------|
| CRITICAL | `OrderForm` | `app/(dashboard)/orders/form/OrderForm.tsx:44` | 23 | 552 | Yes | ✅ Fixed |
| HIGH | `parseFormData` | `app/(dashboard)/orders/actions.ts:24` | 8 | 72 | No | Inherited |
| Moderate | `<arrow>` | `app/(dashboard)/orders/form/OrderForm.tsx:138` | 6 | 42 | Yes | ✅ Fixed |
| Moderate | `OrdersPage` | `app/(dashboard)/orders/page.tsx:9` | 6 | 42 | Yes | Open |
| Moderate | `OrderRow` | `app/(dashboard)/orders/OrderRow.tsx:53` | 6 | 42 | Yes | Open |
| Moderate | `OrderFormPage` | `app/(dashboard)/orders/form/page.tsx:13` | 6 | 42 | No | Inherited |
| Moderate | `getColorsForProduct` | `app/(dashboard)/orders/form/OrderForm.tsx:79` | 5 | 30 | Yes | ✅ Fixed |
| Moderate | `<arrow>` | `app/(dashboard)/orders/OrderRow.tsx:116` | 5 | 30 | Yes | Open |

**Fix applied (2026-06-12):** `OrderForm` (286 lines, complexity 23) was split into three sub-components:
- `OrderForm.tsx` — slim orchestrator (~140 lines)
- `OrderItemRow.tsx` — single item row UI + `getColorsForProduct`
- `OrderDesignFields.tsx` — the 5 optional design fields

---

## Duplication — 2 clone groups (1 introduced)

### Introduced
- Table `<th>` header markup is nearly identical between `app/(dashboard)/orders/page.tsx:82` and `app/(dashboard)/products/page.tsx:47` (10 lines, 2 instances).
- ✅ **Fixed (2026-06-12):** Extracted `components/ui/table-heading.tsx` — both pages now use `<TableHeading>`.

### Inherited
- Auth + `parseFormData` boilerplate duplicated across `customers/actions.ts`, `orders/actions.ts`, and `products/actions.ts` (14 lines, 3 instances).
- Fix: extract into a shared server-action utility.

---

## Dead Code — 12 issues (2 introduced)

### Introduced (`zod-schema/order.ts`)
- `insertOrderItemSchema` (line 5) — exported but never imported — ✅ **Fixed (2026-06-12):** export removed
- `selectOrderItemSchema` (line 23) — exported but never imported — ✅ **Fixed (2026-06-12):** removed entirely along with `SelectOrderItemType` (also unused)

### Inherited (pre-existing)
- `selectOrderSchema` — unused export in `zod-schema/order.ts:22`
- `InsertOrderType` — unused type export in `zod-schema/order.ts:31`
- 8 unused dependencies in `package.json`:
  - `@hookform/resolvers`
  - `@kinde/management-api-js`
  - `@radix-ui/react-checkbox`
  - `@radix-ui/react-dropdown-menu`
  - `@radix-ui/react-label`
  - `@radix-ui/react-select`
  - `@radix-ui/react-tabs`
  - `react-hook-form`

---

## Recommended Actions (priority order)

1. ~~**Refactor `OrderForm`**~~ ✅ Done — split into `OrderForm`, `OrderItemRow`, `OrderDesignFields`.
2. ~~**Remove unused exports** in `zod-schema/order.ts`~~ ✅ Done — `insertOrderItemSchema`, `selectOrderItemSchema`, and `SelectOrderItemType` removed.
3. ~~**Extract a shared table header component**~~ ✅ Done — `components/ui/table-heading.tsx` created and adopted by both pages.
4. **Audit unused dependencies** — verify whether the 8 flagged packages are genuinely unused before removing (some may be used indirectly via shadcn/ui or similar).
