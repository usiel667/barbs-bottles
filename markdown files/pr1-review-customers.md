# PR #1 Review — feat: add customers list and form pages

**Author:** GitHub Copilot (AI)
**Date reviewed:** 2026-04-30
**Status:** DRAFT
**Verdict:** REQUEST CHANGES

---

## Architecture Schematic

```
app/
└── (dashboard)/                      ← Kinde auth guard in layout.tsx
    └── customers/
        ├── page.tsx                  ← Server Component (read)
        │     └── db.select(customers).orderBy(desc(createdAt))
        │
        ├── actions.ts                ← "use server" — mutations
        │     ├── createCustomer()   ← ⚠ NO AUTH CHECK
        │     └── updateCustomer()   ← ⚠ NO AUTH CHECK
        │
        └── form/
              ├── page.tsx            ← Server Component (reads ?id param)
              │     └── db.select(customers).where(eq(id))
              └── CustomerForm.tsx    ← Client Component
                    └── useActionState(action, null)

zod-schema/
└── customer.ts
      └── insertCustomerSchema       ← Validates all form fields

db/
└── schema.ts
      └── customers table            ← email: unique constraint
```

### Request Flow — Create Customer

```
Browser
  │
  ├─ GET /customers/form
  │     └─ DashboardLayout (layout.tsx)
  │           └─ getKindeServerSession() → user check → redirect /login if null
  │                 └─ CustomerFormPage (page.tsx) → CustomerForm.tsx
  │
  └─ POST (form submit) → createCustomer() server action
        │
        ├─ ⚠ NO AUTH CHECK HERE  ← direct POST bypasses layout guard
        │
        ├─ parseFormData(formData)
        ├─ insertCustomerSchema.safeParse(raw)
        │     ├─ FAIL → return { errors }  → displayed inline on form
        │     └─ PASS
        │           └─ db.insert(customers).values(parsed.data)
        │                 ├─ SUCCESS → revalidatePath + redirect /customers
        │                 └─ ⚠ UNIQUE CONSTRAINT ERROR → unhandled 500
```

### Request Flow — Edit Customer

```
Browser
  │
  ├─ GET /customers/form?id=42
  │     └─ DashboardLayout → auth check
  │           └─ CustomerFormPage
  │                 ├─ parseInt(id, 10)   ← ⚠ NaN not guarded
  │                 ├─ db.select(customers).where(eq(id, 42)).limit(1)
  │                 │     └─ not found → notFound()
  │                 └─ <CustomerForm customer={...} />
  │                       └─ updateCustomer.bind(null, 42)
  │
  └─ POST (form submit) → updateCustomer(42, ...) server action
        │
        ├─ ⚠ NO AUTH CHECK HERE
        ├─ parseFormData(formData)
        ├─ insertCustomerSchema.safeParse(raw)
        │     ├─ FAIL → return { errors }
        │     └─ PASS
        │           └─ db.update(customers).set(parsed.data).where(eq(id, 42))
        │                 ├─ SUCCESS → revalidatePath + redirect /customers
        │                 └─ ⚠ UNIQUE CONSTRAINT ERROR → unhandled 500
```

---

## What's Good

| Area | Detail |
|------|--------|
| SQL Injection | Drizzle ORM parameterized queries everywhere — no raw SQL |
| XSS | All output via React JSX (auto-escaped), no `dangerouslySetInnerHTML` |
| Input Validation | Zod `safeParse` on every mutation before any DB write |
| Dashboard Auth | `(dashboard)/layout.tsx` guards all page navigation with Kinde |
| Checkbox handling | `formData.get("active") === "true"` correctly handles unchecked state |
| Cache invalidation | `revalidatePath("/customers")` called after every mutation |
| Responsive UI | Desktop table + mobile card list, good empty state |
| `tel:` / `mailto:` links | Safe — email and phone validated by Zod regex before storage |

---

## Findings

### [HIGH] Server actions have no authentication check

**Files:** `app/(dashboard)/customers/actions.ts`

Next.js server actions are callable via direct `POST` requests to the `/_next/action` endpoint. The `(dashboard)/layout.tsx` auth guard only runs during page navigation — it does **not** protect direct action calls. An unauthenticated user who discovers the endpoint URL can create or overwrite customer records without logging in.

**Current code:**
```ts
// actions.ts
export async function createCustomer(
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const raw = parseFormData(formData);          // ← no auth check before this
  const parsed = insertCustomerSchema.safeParse(raw);
  ...
}
```

**Fix — add at the top of each action:**
```ts
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";

export async function createCustomer(
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const { getUser } = getKindeServerSession();
  const user = await getUser();
  if (!user) throw new Error("Unauthorized");

  const raw = parseFormData(formData);
  ...
}

export async function updateCustomer(
  id: number,
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const { getUser } = getKindeServerSession();
  const user = await getUser();
  if (!user) throw new Error("Unauthorized");

  const raw = parseFormData(formData);
  ...
}
```

---

### [MEDIUM] Duplicate email crashes with an unhandled 500

**Files:** `app/(dashboard)/customers/actions.ts`

The `customers` table has a `UNIQUE` constraint on `email`. If a user submits an email that already exists, the DB driver throws an error that is never caught — the user sees a 500 page instead of a helpful form error.

**Current code:**
```ts
await db.insert(customers).values(parsed.data);  // ← throws on duplicate email
revalidatePath("/customers");
redirect("/customers");
```

**Fix:**
```ts
try {
  await db.insert(customers).values(parsed.data);
} catch (e) {
  // Postgres unique violation code is "23505"
  if (
    e instanceof Error &&
    "code" in e &&
    (e as { code: string }).code === "23505"
  ) {
    return { errors: { email: ["This email is already in use"] } };
  }
  throw e;
}
revalidatePath("/customers");
redirect("/customers");
```

Apply the same pattern to `updateCustomer`.

---

### [LOW] `parseInt` without NaN guard — wrong silent behaviour

**File:** `app/(dashboard)/customers/form/page.tsx` — line 12

`parseInt("abc", 10)` returns `NaN`, which is falsy. Visiting `/customers/form?id=abc` silently renders an empty "Add Customer" form instead of 404-ing. Not a security risk but misleading UX.

**Current code:**
```ts
const customerId = id ? parseInt(id, 10) : null;

let customer = null;
if (customerId) {            // ← NaN is falsy, slips through as "no id"
  ...
}
```

**Fix:**
```ts
const customerId = id ? parseInt(id, 10) : null;
if (customerId !== null && isNaN(customerId)) notFound();

let customer = null;
if (customerId !== null) {
  ...
}
```

---

### [LOW] `insertCustomerSchema` reused for updates — potential field bleed

**Files:** `app/(dashboard)/customers/actions.ts`, `zod-schema/customer.ts`

`drizzle-zod`'s `createInsertSchema` marks auto-defaulted columns (`createdAt`, `updatedAt`) as optional rather than stripping them. Because `updateCustomer` passes `parsed.data` directly into `db.update(...).set(...)`, a crafted request could include a `createdAt` value and overwrite it in the database.

**Current code:**
```ts
// Same schema used for both create and update
const parsed = insertCustomerSchema.safeParse(raw);
...
await db.update(customers).set(parsed.data).where(eq(customers.id, id));
```

**Fix — create a dedicated update schema in `zod-schema/customer.ts`:**
```ts
export const updateCustomerSchema = insertCustomerSchema.omit({
  createdAt: true,
  updatedAt: true,
});
export type UpdateCustomerType = z.infer<typeof updateCustomerSchema>;
```

Then use `updateCustomerSchema` inside `updateCustomer()`.

---

## Summary

| # | Severity | Issue | File |
|---|----------|-------|------|
| 1 | HIGH | Server actions callable without auth | `actions.ts` |
| 2 | MEDIUM | Unhandled DB unique constraint on email | `actions.ts` |
| 3 | LOW | `parseInt` NaN not guarded | `form/page.tsx` |
| 4 | LOW | `insertCustomerSchema` reused for updates | `actions.ts` / `zod-schema/customer.ts` |

Fix #1 before merging. #2 is a UX-breaking bug worth fixing in the same PR. #3 and #4 are polish items.
