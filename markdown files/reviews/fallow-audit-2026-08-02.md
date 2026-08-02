# Fallow Audit Report — 2026-08-02

**Branch:** `products-inventory-update1.2`
**Scope:** Full repo analysis (`analyze`, not diff-scoped)
**Verdict:** 31 findings — all dead-code/dependency category, 0 structural issues
**Status:** Findings presented to user, no fixes applied yet

---

## Dead Code — 23 issues

### Unused file (1)
| File | Notes |
|------|-------|
| `db/clear.ts` | Not imported anywhere and not wired into a `package.json` script (unlike `db:seed`/`db:migrate`/`db:push`). Likely a false positive if it's still run manually via `npx tsx db/clear.ts` — fallow can't see manual CLI invocation as a usage. Consider adding a `db:clear` script if it should stay discoverable. |

### Unused exports (11)
| Export | File |
|--------|------|
| `buttonVariants` | `components/ui/button.tsx` |
| `OrderStatuses` | `constants/ProductConstants.ts` |
| `formatPrice` | `lib/utils.ts` |
| `formatDate` | `lib/utils.ts` |
| `selectBottleSizeSchema` | `zod-schema/*.ts` |
| `selectCustomerSchema` | `zod-schema/*.ts` |
| `selectOrderSchema` | `zod-schema/order.ts` |
| `selectProductSchema` | `zod-schema/*.ts` |
| `productSchema` | `zod-schema/*.ts` |
| `selectProductDesignSchema` | `zod-schema/*.ts` |
| `selectProductSeriesSchema` | `zod-schema/*.ts` |

### Unused type exports (11)
`ButtonProps`, `InsertBottleSizeType`, `SelectBottleSizeType`, `InsertCustomerType`, `UpdateCustomerType`, `InsertOrderType`, `InsertProductType`, `updateProductType`, `InsertProductDesignType`, `InsertProductSeriesType`, `SelectProductSeriesType`

Mostly the `Insert*Type`/`Select*Type` companions to the unused exports above — drizzle-zod boilerplate. Plausible some are intentionally kept available for future features even though nothing imports them yet; not necessarily safe to delete on sight.

---

## Unused Dependencies — 8 issues

| Package | Notes |
|---------|-------|
| `@hookform/resolvers` | App uses `useActionState` + server actions, not react-hook-form |
| `react-hook-form` | Same as above |
| `@radix-ui/react-checkbox` | Unused Radix primitive |
| `@radix-ui/react-dropdown-menu` | Unused Radix primitive |
| `@radix-ui/react-label` | Unused Radix primitive |
| `@radix-ui/react-select` | Unused Radix primitive |
| `@radix-ui/react-tabs` | Unused Radix primitive |
| `@kinde/management-api-js` | Kinde's management API client — separate from the auth client actually in use |

---

## Cleared (0 findings)

| Category | Result |
|----------|--------|
| Circular dependencies | None |
| Boundary violations | None |
| Duplicate exports | None |
| Re-export cycles | None |
| Unresolved/unlisted imports | None |
| Catalog issues | None |

---

## Recommended Actions (priority order)

1. **Decide on `db/clear.ts`** — either add a `db:clear` script to `package.json` (documents it as an entry point) or delete it if it's no longer used.
2. **Audit unused dependencies** before removing — confirm none are used indirectly (e.g. via shadcn/ui internals) before running `npm uninstall`.
3. **Review unused `select*Schema`/`Insert*Type` exports** in `zod-schema/*.ts` — decide case by case whether each is dead weight or intentional forward-looking API surface, then remove or keep deliberately.
4. Nothing here is urgent — no correctness or security impact, purely cleanup.
