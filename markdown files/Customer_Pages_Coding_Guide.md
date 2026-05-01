# Customer Pages — Step-by-Step Coding Guide

Based on Copilot PR #1 (`feat: add customers list and form pages`) with all review findings applied.

**Files you will create/edit (in order):**

1. `zod-schema/customer.ts` — add `updateCustomerSchema` *(edit existing)*
2. `app/(dashboard)/customers/actions.ts` — server actions *(new file)*
3. `app/(dashboard)/customers/form/page.tsx` — form server wrapper *(new file)*
4. `app/(dashboard)/customers/form/CustomerForm.tsx` — form client component *(new file)*
5. `app/(dashboard)/customers/page.tsx` — customer list *(new file)*

---

## Step 1 — Update `zod-schema/customer.ts`

**Why:** The Copilot PR used `insertCustomerSchema` for both create and update. Drizzle-Zod marks auto-defaulted columns (`createdAt`, `updatedAt`) as optional rather than stripping them, so a crafted update request could overwrite `createdAt` in the database. A dedicated update schema fixes this.

**What to add** at the bottom of the existing file (after the `selectCustomerSchema` export):

```ts
export const updateCustomerSchema = insertCustomerSchema.omit({
  createdAt: true,
  updatedAt: true,
});
export type UpdateCustomerType = z.infer<typeof updateCustomerSchema>;
```

Your file should now export four things: `insertCustomerSchema`, `selectCustomerSchema`, `InsertCustomerType`, `SelectCustomerType`, `updateCustomerSchema`, `UpdateCustomerType`.

---

## Step 2 — Create `app/(dashboard)/customers/actions.ts`

**Why this file:** Server actions are the "use server" mutations for create and update. They live here so the client form can import and call them.

**Review issues to apply in this file:**
- **[HIGH]** Add an auth check at the very top of each action — Next.js server actions are callable via direct POST to `/_next/action`, completely bypassing the layout auth guard.
- **[MEDIUM]** Wrap the DB insert/update in a try/catch and return a friendly field error when Postgres throws a unique constraint violation (error code `"23505"`) instead of letting it crash to a 500.
- **[LOW]** Use `updateCustomerSchema` (not `insertCustomerSchema`) inside `updateCustomer` so `createdAt`/`updatedAt` cannot be overwritten.

Create the file:

```ts
"use server";

import { db } from "@/db";
import { customers } from "@/db/schema";
import { insertCustomerSchema, updateCustomerSchema } from "@/zod-schema/customer";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

type FormState = {
  errors?: Record<string, string[]>;
} | null;

// Pulls named fields out of FormData into a plain object.
// Checkbox trick: an unchecked checkbox sends no value, so we compare
// against the string "true" rather than using Boolean(formData.get(...)).
function parseFormData(formData: FormData) {
  return {
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    address1: formData.get("address1"),
    address2: formData.get("address2") || undefined,
    city: formData.get("city"),
    state: formData.get("state"),
    zipCode: formData.get("zipCode"),
    notes: formData.get("notes") || undefined,
    active: formData.get("active") === "true",
  };
}

export async function createCustomer(
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  // [HIGH FIX] Auth check — layout guard does NOT protect direct action calls
  const { getUser } = getKindeServerSession();
  const user = await getUser();
  if (!user) throw new Error("Unauthorized");

  const raw = parseFormData(formData);
  const parsed = insertCustomerSchema.safeParse(raw);
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  // [MEDIUM FIX] Catch unique constraint violations so the user sees a field
  // error instead of a 500 page
  try {
    await db.insert(customers).values(parsed.data);
  } catch (e) {
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
}

export async function updateCustomer(
  id: number,
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  // [HIGH FIX] Auth check
  const { getUser } = getKindeServerSession();
  const user = await getUser();
  if (!user) throw new Error("Unauthorized");

  const raw = parseFormData(formData);

  // [LOW FIX] Use updateCustomerSchema so createdAt/updatedAt cannot be
  // sent in a crafted request and overwritten in the DB
  const parsed = updateCustomerSchema.safeParse(raw);
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  // [MEDIUM FIX] Same unique constraint handling for update
  try {
    await db.update(customers).set(parsed.data).where(eq(customers.id, id));
  } catch (e) {
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
}
```

---

## Step 3 — Create `app/(dashboard)/customers/form/page.tsx`

**Why this file:** This is the server component that reads the `?id` search param and pre-fetches the customer for edit mode, then passes it down to the client form.

**Review issue to apply:**
- **[LOW]** `parseInt("abc", 10)` returns `NaN`, which is falsy. Without a guard, visiting `/customers/form?id=abc` silently renders an empty "Add Customer" form instead of 404-ing. Add an `isNaN` check after parsing.

Create the file:

```tsx
import { db } from "@/db";
import { customers } from "@/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { CustomerForm } from "./CustomerForm";

type Props = {
  searchParams: Promise<{ id?: string }>;
};

export default async function CustomerFormPage({ searchParams }: Props) {
  const { id } = await searchParams;
  const customerId = id ? parseInt(id, 10) : null;

  // [LOW FIX] parseInt("abc") returns NaN which is falsy — guard it explicitly
  // so a bad ?id value gets a 404 instead of silently showing the add form
  if (customerId !== null && isNaN(customerId)) notFound();

  let customer = null;
  if (customerId !== null) {
    const result = await db
      .select()
      .from(customers)
      .where(eq(customers.id, customerId))
      .limit(1);

    if (!result.length) {
      notFound();
    }
    customer = result[0];
  }

  return <CustomerForm customer={customer} />;
}
```

---

## Step 4 — Create `app/(dashboard)/customers/form/CustomerForm.tsx`

**Why this file:** The client component that owns the form state. It uses `useActionState` to call the right server action (create or update) and displays Zod validation errors inline. It is shared between add and edit modes.

**No review issues apply here** — this file is clean as Copilot wrote it.

A few things worth understanding before you type it:
- `useActionState(action, initialState)` returns `[state, formAction, isPending]`. The `formAction` is what you pass to `<form action={...}>`.
- For edit mode, the action is bound with the customer id: `updateCustomer.bind(null, customer.id)`. This pre-fills the first argument so `useActionState` only needs to inject `_prevState` and `formData`.
- `defaultValue` (not `value`) is used on all inputs so the form stays uncontrolled — React does not fight you on re-renders.
- The checkbox sends the string `"true"` when checked and nothing when unchecked, which is why `actions.ts` compares with `=== "true"`.

Create the file:

```tsx
"use client";

import { useActionState } from "react";
import { createCustomer, updateCustomer } from "@/app/(dashboard)/customers/actions";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { SelectCustomerType } from "@/zod-schema/customer";

type FormState = {
  errors?: Record<string, string[]>;
} | null;

const US_STATES = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA",
  "HI","ID","IL","IN","IA","KS","KY","LA","ME","MD",
  "MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ",
  "NM","NY","NC","ND","OH","OK","OR","PA","RI","SC",
  "SD","TN","TX","UT","VT","VA","WA","WV","WI","WY",
];

function FieldError({ errors }: { errors?: string[] }) {
  if (!errors?.length) return null;
  return <p className="text-sm text-red-600 mt-1">{errors[0]}</p>;
}

type Props = {
  customer?: SelectCustomerType | null;
};

export function CustomerForm({ customer }: Props) {
  const isEditing = Boolean(customer);

  const action = isEditing
    ? updateCustomer.bind(null, customer!.id)
    : createCustomer;

  const [state, formAction, isPending] = useActionState<FormState, FormData>(
    action,
    null
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {isEditing ? "Edit Customer" : "Add New Customer"}
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            {isEditing
              ? `Editing ${customer!.firstName} ${customer!.lastName}`
              : "Fill in the details to add a new customer"}
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/customers">Back to Customers</Link>
        </Button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border p-6">
        <form action={formAction} className="space-y-6">

          {/* Personal Information */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Personal Information
            </h2>
            <div className="grid gap-4 md:grid-cols-2">

              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  First Name <span className="text-red-500">*</span>
                </label>
                <input
                  id="firstName" name="firstName" type="text"
                  defaultValue={customer?.firstName}
                  className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Jane"
                />
                <FieldError errors={state?.errors?.firstName} />
              </div>

              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Last Name <span className="text-red-500">*</span>
                </label>
                <input
                  id="lastName" name="lastName" type="text"
                  defaultValue={customer?.lastName}
                  className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Smith"
                />
                <FieldError errors={state?.errors?.lastName} />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  id="email" name="email" type="email"
                  defaultValue={customer?.email}
                  className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="jane@example.com"
                />
                <FieldError errors={state?.errors?.email} />
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Phone <span className="text-red-500">*</span>
                </label>
                <input
                  id="phone" name="phone" type="tel"
                  defaultValue={customer?.phone}
                  className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="+15551234567"
                />
                <FieldError errors={state?.errors?.phone} />
              </div>

            </div>
          </div>

          {/* Address */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Address
            </h2>
            <div className="grid gap-4">

              <div>
                <label htmlFor="address1" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Address Line 1 <span className="text-red-500">*</span>
                </label>
                <input
                  id="address1" name="address1" type="text"
                  defaultValue={customer?.address1}
                  className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="123 Main St"
                />
                <FieldError errors={state?.errors?.address1} />
              </div>

              <div>
                <label htmlFor="address2" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Address Line 2
                </label>
                <input
                  id="address2" name="address2" type="text"
                  defaultValue={customer?.address2 ?? ""}
                  className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Apt 4B"
                />
              </div>

              <div className="grid gap-4 md:grid-cols-3">

                <div>
                  <label htmlFor="city" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    City <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="city" name="city" type="text"
                    defaultValue={customer?.city}
                    className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Springfield"
                  />
                  <FieldError errors={state?.errors?.city} />
                </div>

                <div>
                  <label htmlFor="state" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    State <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="state" name="state"
                    defaultValue={customer?.state ?? ""}
                    className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select state</option>
                    {US_STATES.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                  <FieldError errors={state?.errors?.state} />
                </div>

                <div>
                  <label htmlFor="zipCode" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Zip Code <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="zipCode" name="zipCode" type="text"
                    defaultValue={customer?.zipCode}
                    className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="12345"
                  />
                  <FieldError errors={state?.errors?.zipCode} />
                </div>

              </div>
            </div>
          </div>

          {/* Additional Info */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Additional Information
            </h2>
            <div className="grid gap-4">

              <div>
                <label htmlFor="notes" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Notes
                </label>
                <textarea
                  id="notes" name="notes" rows={3}
                  defaultValue={customer?.notes ?? ""}
                  className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Any special notes about this customer..."
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  id="active" name="active" type="checkbox"
                  defaultChecked={customer?.active ?? true}
                  value="true"
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="active" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Active customer
                </label>
              </div>

            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button
              type="submit"
              disabled={isPending}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isPending
                ? isEditing ? "Saving..." : "Adding..."
                : isEditing ? "Save Changes" : "Add Customer"}
            </Button>
            <Button asChild variant="outline">
              <Link href="/customers">Cancel</Link>
            </Button>
          </div>

        </form>
      </div>
    </div>
  );
}
```

---

## Step 5 — Create `app/(dashboard)/customers/page.tsx`

**Why this file:** The list/index page. It is a server component that fetches all customers and renders them in a responsive layout — a sortable table on desktop and stacked cards on mobile.

**No review issues apply here** — this file is clean as Copilot wrote it. The layout guard in `(dashboard)/layout.tsx` already protects this read-only route.

Create the file:

```tsx
import { db } from "@/db";
import { customers } from "@/db/schema";
import { desc } from "drizzle-orm";
import { Users, Plus, Mail, Phone, MapPin } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function CustomersPage() {
  const allCustomers = await db
    .select()
    .from(customers)
    .orderBy(desc(customers.createdAt));

  return (
    <div className="space-y-6">

      {/* Page header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Customers
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            {allCustomers.length} customer{allCustomers.length !== 1 ? "s" : ""} total
          </p>
        </div>
        <Button asChild className="bg-blue-600 hover:bg-blue-700 text-white">
          <Link href="/customers/form">
            <Plus className="h-4 w-4" />
            Add Customer
          </Link>
        </Button>
      </div>

      {allCustomers.length === 0 ? (

        /* Empty state */
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border p-12 text-center">
          <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            No customers yet
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Get started by adding your first customer.
          </p>
          <Button asChild className="bg-blue-600 hover:bg-blue-700 text-white">
            <Link href="/customers/form">
              <Plus className="h-4 w-4" />
              Add First Customer
            </Link>
          </Button>
        </div>

      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border overflow-hidden">

          {/* Desktop table — hidden on mobile */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Contact</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Location</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Joined</th>
                  <th className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {allCustomers.map((customer) => (
                  <tr key={customer.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">

                    {/* Name + initials avatar */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-600 dark:text-blue-300 font-semibold text-sm flex-shrink-0">
                          {customer.firstName[0] ?? ""}{customer.lastName[0] ?? ""}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {customer.firstName} {customer.lastName}
                          </p>
                          {customer.notes && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-xs">
                              {customer.notes}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Contact */}
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1 text-gray-700 dark:text-gray-300">
                          <Mail className="h-3.5 w-3.5 text-gray-400" />
                          <a href={`mailto:${customer.email}`} className="hover:text-blue-600 hover:underline">
                            {customer.email}
                          </a>
                        </div>
                        <div className="flex items-center gap-1 text-gray-700 dark:text-gray-300">
                          <Phone className="h-3.5 w-3.5 text-gray-400" />
                          <a href={`tel:${customer.phone}`} className="hover:underline">
                            {customer.phone}
                          </a>
                        </div>
                      </div>
                    </td>

                    {/* Location */}
                    <td className="px-6 py-4">
                      <div className="flex items-start gap-1 text-gray-700 dark:text-gray-300">
                        <MapPin className="h-3.5 w-3.5 text-gray-400 mt-0.5 flex-shrink-0" />
                        <div className="text-sm">
                          <p>{customer.address1}</p>
                          {customer.address2 && <p>{customer.address2}</p>}
                          <p>{customer.city}, {customer.state} {customer.zipCode}</p>
                        </div>
                      </div>
                    </td>

                    {/* Status badge */}
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        customer.active
                          ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                          : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
                      }`}>
                        {customer.active ? "Active" : "Inactive"}
                      </span>
                    </td>

                    {/* Joined date */}
                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                      {new Date(customer.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </td>

                    {/* Edit action */}
                    <td className="px-6 py-4 text-right">
                      <Button asChild variant="ghost" size="sm">
                        <Link href={`/customers/form?id=${customer.id}`}>Edit</Link>
                      </Button>
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile card list — hidden on desktop */}
          <div className="md:hidden divide-y divide-gray-200 dark:divide-gray-700">
            {allCustomers.map((customer) => (
              <div key={customer.id} className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-600 dark:text-blue-300 font-semibold">
                      {customer.firstName[0] ?? ""}{customer.lastName[0] ?? ""}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {customer.firstName} {customer.lastName}
                      </p>
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                        customer.active
                          ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                          : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
                      }`}>
                        {customer.active ? "Active" : "Inactive"}
                      </span>
                    </div>
                  </div>
                  <Button asChild variant="ghost" size="sm">
                    <Link href={`/customers/form?id=${customer.id}`}>Edit</Link>
                  </Button>
                </div>

                <div className="space-y-1 text-sm text-gray-700 dark:text-gray-300">
                  <div className="flex items-center gap-1.5">
                    <Mail className="h-3.5 w-3.5 text-gray-400" />
                    <a href={`mailto:${customer.email}`} className="hover:underline">{customer.email}</a>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Phone className="h-3.5 w-3.5 text-gray-400" />
                    <a href={`tel:${customer.phone}`} className="hover:underline">{customer.phone}</a>
                  </div>
                  <div className="flex items-start gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-gray-400 mt-0.5" />
                    <span>{customer.city}, {customer.state} {customer.zipCode}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

        </div>
      )}
    </div>
  );
}
```

---

## Review Findings Checklist

| # | Severity | Issue | Where you fixed it |
|---|----------|-------|--------------------|
| 1 | HIGH | Server actions callable without auth | Top of each function in `actions.ts` (Steps 2) |
| 2 | MEDIUM | Unhandled DB unique constraint on email | try/catch in `createCustomer` and `updateCustomer` (Step 2) |
| 3 | LOW | `parseInt` NaN not guarded | `isNaN` check in `form/page.tsx` (Step 3) |
| 4 | LOW | `insertCustomerSchema` reused for updates | `updateCustomerSchema` in `zod-schema/customer.ts` and `actions.ts` (Steps 1 & 2) |

All four issues from the review are applied. The PR can be closed — write this code on your own branch instead.
