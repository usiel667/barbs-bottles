# Multi-Item Orders Implementation Guide

This document describes every change needed to support multiple line items per order,
matching the expandable-row design shown in the reference screenshot.

---

## What Changes (Overview)

| Area                                        | Change                                                                                 |
| ------------------------------------------- | -------------------------------------------------------------------------------------- |
| `db/schema.ts`                              | Add `order_items` table; remove `productId`, `quantity`, `selectedColor` from `orders` |
| `db/migrations/`                            | New migration SQL file                                                                 |
| `db/seed.ts`                                | Update to insert `order_items` rows                                                    |
| `zod-schema/order.ts`                       | Add `orderItemSchema`; update order schemas                                            |
| `app/(dashboard)/orders/actions.ts`         | Parse and insert multiple items                                                        |
| `app/(dashboard)/orders/form/page.tsx`      | Load existing items when editing                                                       |
| `app/(dashboard)/orders/form/OrderForm.tsx` | Dynamic items UI with Add/Remove                                                       |
| `app/(dashboard)/orders/page.tsx`           | Expandable rows with line-item table and summary                                       |

---

## Step 1 — Update `db/schema.ts`

### Remove from the `orders` table
Delete these three columns from the `orders` pgTable definition:
```ts
// REMOVE these three lines:
productId: integer("product_id").notNull().references(() => products.id),
quantity: integer("quantity").notNull().default(1),
selectedColor: varchar("selected_color", { length: 50 }).notNull(),
```

### Add the new `order_items` table (insert after the `orders` table definition)
```ts
export const orderItems = pgTable("order_items", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id")
    .notNull()
    .references(() => orders.id, { onDelete: "cascade" }),
  productId: integer("product_id")
    .notNull()
    .references(() => products.id),
  quantity: integer("quantity").notNull().default(1),
  selectedColor: varchar("selected_color", { length: 50 }).notNull(),
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).notNull(),
  discount: decimal("discount", { precision: 5, scale: 2 }).default("0"),
});
```

### Update the relations section
Replace the `orderRelations` block and add `orderItemRelations`:
```ts
export const orderRelations = relations(orders, ({ one, many }) => ({
  customer: one(customers, {
    fields: [orders.customerId],
    references: [customers.id],
  }),
  items: many(orderItems),
}));

export const orderItemRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
  product: one(products, {
    fields: [orderItems.productId],
    references: [products.id],
  }),
}));

export const productRelations = relations(products, ({ many }) => ({
  orders: many(orderItems),
}));
```

Also add `orderItems` to the imports wherever `orders` is imported from the schema.

---

## Step 2 — Create Migration File

Create `db/migrations/0002_multi_item_orders.sql`:

```sql
--> statement-breakpoint
CREATE TABLE "order_items" (
  "id" serial PRIMARY KEY NOT NULL,
  "order_id" integer NOT NULL,
  "product_id" integer NOT NULL,
  "quantity" integer DEFAULT 1 NOT NULL,
  "selected_color" varchar(50) NOT NULL,
  "unit_price" numeric(10, 2) NOT NULL,
  "discount" numeric(5, 2) DEFAULT '0'
);
--> statement-breakpoint

-- Migrate existing single-item orders into order_items before dropping columns
-- NULLIF guards against any legacy rows with quantity = 0 (would cause divide-by-zero)
INSERT INTO "order_items" ("order_id", "product_id", "quantity", "selected_color", "unit_price")
SELECT id, product_id, quantity, selected_color, total_price / NULLIF(quantity, 0)
FROM "orders";
--> statement-breakpoint

ALTER TABLE "orders" DROP COLUMN "product_id";
--> statement-breakpoint
ALTER TABLE "orders" DROP COLUMN "quantity";
--> statement-breakpoint
ALTER TABLE "orders" DROP COLUMN "selected_color";
--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_orders_id_fk"
  FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_product_id_products_id_fk"
  FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;
```

Then add an entry to `db/migrations/meta/_journal.json`:
```json
{
  "idx": 2,
  "version": "7",
  "when": 1747180800000,
  "tag": "0002_multi_item_orders",
  "breakpoints": true
}
```

Run the migration:
```bash
npm run db:migrate
```

> **Note:** You could use `npm run db:generate` to auto-generate this migration file instead of writing it manually. However, Drizzle Kit only handles schema structure — it will **not** include the data migration step that copies existing order data into `order_items` before dropping the columns from `orders`. That INSERT is necessary to preserve real data. For this reason, follow the manual steps above so the data migration is included.

---

## Step 3 — Update `db/seed.ts`

Add `orderItems` to the import:
```ts
import { customers, products, orders, orderItems } from "./schema";
```

Replace the orders seed block with:
```ts
const orderIds = await db.insert(orders).values([
  {
    customerId: customerIds[0].id,
    customDesignText: "Sarah's Hydration",
    designNotes: "Logo on both sides",
    status: "design",
    totalPrice: "49.98",
    assignedTo: "designer@example.com",
  },
  {
    customerId: customerIds[1].id,
    customDesignText: "Chen Corp",
    designNotes: "Company logo in blue",
    status: "production",
    totalPrice: "999.50",
    assignedTo: "production@example.com",
  },
]).returning({ id: orders.id });

await db.insert(orderItems).values([
  {
    orderId: orderIds[0].id,
    productId: productIds[0].id,
    quantity: 2,
    selectedColor: "black",
    unitPrice: "24.99",
    discount: "0",
  },
  {
    orderId: orderIds[1].id,
    productId: productIds[1].id,
    quantity: 50,
    selectedColor: "white",
    unitPrice: "19.99",
    discount: "0",
  },
]);
```

---

## Step 4 — Update `zod-schema/order.ts`

Replace the entire file:
```ts
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { orders, orderItems } from "@/db/schema";
import { z } from "zod";

export const insertOrderItemSchema = createInsertSchema(orderItems, {
  quantity: (schema) => schema.min(1, "Quantity must be at least 1"),
  selectedColor: (schema) => schema.min(1, "Color is required"),
  unitPrice: (schema) => schema.refine((v) => parseFloat(v) >= 0, {
    message: "Unit price must be 0 or more",
  }),
});

export const insertOrderSchema = createInsertSchema(orders, {
  totalPrice: (schema) => schema.refine((val) => parseFloat(val) > 0, {
    message: "Total price must be greater than 0",
  }),
}).extend({
  items: z.array(insertOrderItemSchema.omit({ orderId: true })).min(1, "At least one item is required"),
});

export const selectOrderSchema = createSelectSchema(orders);
export const selectOrderItemSchema = createSelectSchema(orderItems);

export const updateOrderSchema = insertOrderSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertOrderType = z.infer<typeof insertOrderSchema>;
export type SelectOrderType = z.infer<typeof selectOrderSchema>;
export type SelectOrderItemType = z.infer<typeof selectOrderItemSchema>;
```

---

## Step 5 — Update `app/(dashboard)/orders/actions.ts`

Replace the entire file:

> **Security note:** `totalPrice` is computed server-side from the parsed items — never
> trusted from the client. The hidden `totalPrice` input in the form is display-only and
> intentionally omitted from `parseFormData`.

```ts
"use server";

import { db } from "@/db";
import { orders, orderItems } from "@/db/schema";
import { insertOrderSchema, updateOrderSchema } from "@/zod-schema/order";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

type FormState = {
  errors?: Record<string, string[]>;
} | null;

function computeTotal(items: { unitPrice: string; quantity: number; discount: string }[]): string {
  const total = items.reduce((sum, item) => {
    const price = parseFloat(item.unitPrice) || 0;
    const disc = parseFloat(item.discount) || 0;
    return sum + price * item.quantity * (1 - disc / 100);
  }, 0);
  return total.toFixed(2);
}

function parseFormData(formData: FormData) {
  const estimatedDeliveryRaw = formData.get("estimatedDelivery") as string | null;
  const itemCount = Number(formData.get("itemCount") ?? 0);

  const items = Array.from({ length: itemCount }, (_, i) => ({
    productId: Number(formData.get(`items[${i}][productId]`)),
    quantity: Number(formData.get(`items[${i}][quantity]`) ?? 1),
    selectedColor: formData.get(`items[${i}][selectedColor]`) as string,
    unitPrice: formData.get(`items[${i}][unitPrice]`) as string,
    discount: formData.get(`items[${i}][discount]`) as string || "0",
  }));

  return {
    customerId: Number(formData.get("customerId")),
    customDesignText: formData.get("customDesignText") || undefined,
    customLogoUrl: formData.get("customLogoUrl") || undefined,
    designNotes: formData.get("designNotes") || undefined,
    designProofUrl: formData.get("designProofUrl") || undefined,
    status: formData.get("status"),
    // totalPrice is computed server-side, never taken from the client
    totalPrice: computeTotal(items),
    estimatedDelivery: estimatedDeliveryRaw ? new Date(estimatedDeliveryRaw) : undefined,
    assignedTo: formData.get("assignedTo") || "unassigned",
    items,
  };
}

export async function createOrder(
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const { getUser } = getKindeServerSession();
  const user = await getUser();
  if (!user) throw new Error("Unauthorized");

  const raw = parseFormData(formData);
  const parsed = insertOrderSchema.safeParse(raw);
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  const { items, ...orderData } = parsed.data;

  const [newOrder] = await db.insert(orders).values(orderData).returning({ id: orders.id });

  await db.insert(orderItems).values(
    items.map((item) => ({ ...item, orderId: newOrder.id }))
  );

  revalidatePath("/orders");
  redirect("/orders");
}

export async function updateOrder(
  id: number,
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const { getUser } = getKindeServerSession();
  const user = await getUser();
  if (!user) throw new Error("Unauthorized");

  const raw = parseFormData(formData);
  const parsed = updateOrderSchema.safeParse(raw);
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  const { items, ...orderData } = parsed.data;

  await db.update(orders).set(orderData).where(eq(orders.id, id));

  // Replace all items for this order
  await db.delete(orderItems).where(eq(orderItems.orderId, id));
  await db.insert(orderItems).values(
    items.map((item) => ({ ...item, orderId: id }))
  );

  revalidatePath("/orders");
  redirect("/orders");
}
```

---

## Step 6 — Update `app/(dashboard)/orders/form/page.tsx`

Add `orderItems` to the DB import and fetch them when editing:

```ts
import { db } from "@/db";
import { orders, customers, products, orderItems } from "@/db/schema";
import { eq, asc } from "drizzle-orm";
import { notFound } from "next/navigation";
import { OrderForm } from "./OrderForm";
import { SelectOrderItemType } from "@/zod-schema/order";

type Props = {
  searchParams: Promise<{ id?: string }>;
};

export default async function OrderFormPage({ searchParams }: Props) {
  const { id } = await searchParams;
  const orderId = id ? parseInt(id, 10) : null;

  if (orderId !== null && isNaN(orderId)) notFound();

  const [allCustomers, allProducts] = await Promise.all([
    db.select().from(customers).orderBy(asc(customers.lastName)),
    db.select().from(products)
      .where(eq(products.active, true))
      .orderBy(asc(products.name)),
  ]);

  let order = null;
  let existingItems: SelectOrderItemType[] = [];

  if (orderId !== null) {
    const result = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
    if (!result.length) notFound();
    order = result[0];

    existingItems = await db.select().from(orderItems).where(eq(orderItems.orderId, orderId));
  }

  return (
    <OrderForm
      order={order}
      existingItems={existingItems}
      customers={allCustomers}
      products={allProducts}
    />
  );
}
```

---

## Step 7 — Replace `app/(dashboard)/orders/form/OrderForm.tsx`

This is the biggest change. The form now manages a dynamic list of items.

Key concepts:
- `items` state: array of `{ productId, selectedColor, quantity, unitPrice, discount }`
- `addItem()` appends a blank row
- `removeItem(index)` removes a row
- `updateItem(index, field, value)` updates a field on one row
- When a product is selected in a row, auto-populate `unitPrice` from the product's `basePrice`
- The color dropdown for each row is derived from the selected product's `colors` JSON
- A hidden input `itemCount` tells the server action how many rows exist
- Each field uses the name pattern `items[i][fieldName]` so the server action can parse them
- The displayed `calculatedTotal` is for the user's reference only — the server recomputes it from items

```tsx
"use client";

import { useState } from "react";
import { useActionState } from "react";
import { createOrder, updateOrder } from "@/app/(dashboard)/orders/actions";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { SelectOrderType } from "@/zod-schema/order";
import { SelectOrderItemType } from "@/zod-schema/order";
import { SelectCustomerType } from "@/zod-schema/customer";
import { SelectProductType } from "@/zod-schema/product";

type FormState = {
  errors?: Record<string, string[]>;
} | null;

function FieldError({ errors }: { errors?: string[] }) {
  if (!errors?.length) return null;
  return <p className="text-sm text-red-600 mt-1">{errors[0]}</p>;
}

const ORDER_STATUSES = [
  { id: "pending", label: "Pending" },
  { id: "design", label: "Design" },
  { id: "production", label: "Production" },
  { id: "quality_check", label: "Quality Check" },
  { id: "shipped", label: "Shipped" },
  { id: "delivered", label: "Delivered" },
  { id: "canceled", label: "Canceled" },
];

type ItemRow = {
  productId: number | "";
  selectedColor: string;
  quantity: number;
  unitPrice: string;
  discount: string;
};

type Props = {
  order?: SelectOrderType | null;
  existingItems?: SelectOrderItemType[];
  customers: SelectCustomerType[];
  products: SelectProductType[];
};

function getColors(products: SelectProductType[], productId: number | ""): string[] {
  if (!productId) return [];
  const p = products.find((p) => p.id === Number(productId));
  if (!p?.colors) return [];
  try { return JSON.parse(p.colors); } catch { return []; }
}

export function OrderForm({ order, existingItems = [], customers, products }: Props) {
  const isEditing = Boolean(order);

  const initialItems: ItemRow[] = existingItems.length > 0
    ? existingItems.map((item) => ({
        productId: item.productId,
        selectedColor: item.selectedColor,
        quantity: item.quantity,
        unitPrice: String(item.unitPrice),
        discount: String(item.discount ?? "0"),
      }))
    : [{ productId: "", selectedColor: "", quantity: 1, unitPrice: "", discount: "0" }];

  const [items, setItems] = useState<ItemRow[]>(initialItems);

  function addItem() {
    setItems((prev) => [...prev, { productId: "", selectedColor: "", quantity: 1, unitPrice: "", discount: "0" }]);
  }

  function removeItem(index: number) {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }

  function updateItem(index: number, field: keyof ItemRow, value: string | number) {
    setItems((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      if (field === "productId") {
        const p = products.find((p) => p.id === Number(value));
        next[index].unitPrice = p?.basePrice ?? "";
        next[index].selectedColor = "";
      }
      return next;
    });
  }

  // Display-only total — server recomputes this from items on submit
  const calculatedTotal = items.reduce((sum, item) => {
    const price = parseFloat(item.unitPrice) || 0;
    const qty = item.quantity || 0;
    const disc = parseFloat(item.discount) || 0;
    return sum + price * qty * (1 - disc / 100);
  }, 0);

  const action = isEditing ? updateOrder.bind(null, order!.id) : createOrder;
  const [state, formAction, isPending] = useActionState<FormState, FormData>(action, null);

  const deliveryDefault = order?.estimatedDelivery
    ? new Date(order.estimatedDelivery).toISOString().split("T")[0]
    : "";

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {isEditing ? "Edit Order" : "New Order"}
        </h1>
        <Button asChild variant="outline" className="dark:text-white">
          <Link href="/orders">Cancel</Link>
        </Button>
      </div>

      <form action={formAction} className="space-y-6 bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border">

        {/* Hidden count so the server knows how many items to parse */}
        <input type="hidden" name="itemCount" value={items.length} />

        {/* Customer */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Customer <span className="text-red-500">*</span>
          </label>
          <select
            name="customerId"
            defaultValue={order?.customerId ?? ""}
            className="w-full border rounded-md px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          >
            <option value="">Select customer</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>{c.firstName} {c.lastName}</option>
            ))}
          </select>
          <FieldError errors={state?.errors?.customerId} />
        </div>

        {/* Line Items */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Items <span className="text-red-500">*</span>
            </label>
            <button
              type="button"
              onClick={addItem}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              + Add Item
            </button>
          </div>

          <div className="space-y-3">
            {items.map((item, i) => {
              const colors = getColors(products, item.productId);
              return (
                <div key={i} className="border rounded-md p-3 space-y-3 dark:border-gray-600">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                      Item {i + 1}
                    </span>
                    {items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeItem(i)}
                        className="text-xs text-red-500 hover:text-red-700"
                      >
                        Remove
                      </button>
                    )}
                  </div>

                  {/* Product */}
                  <div>
                    <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Product</label>
                    <select
                      name={`items[${i}][productId]`}
                      value={item.productId}
                      onChange={(e) => updateItem(i, "productId", e.target.value ? Number(e.target.value) : "")}
                      className="w-full border rounded-md px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    >
                      <option value="">Select product</option>
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} — {p.size} ({p.material.replace("_", " ")})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {/* Color */}
                    <div>
                      <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Color</label>
                      <select
                        name={`items[${i}][selectedColor]`}
                        value={item.selectedColor}
                        onChange={(e) => updateItem(i, "selectedColor", e.target.value)}
                        disabled={colors.length === 0}
                        className="w-full border rounded-md px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white disabled:opacity-50"
                      >
                        <option value="">{colors.length === 0 ? "Select product first" : "Select color"}</option>
                        {colors.map((c) => (
                          <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                        ))}
                      </select>
                    </div>

                    {/* Quantity */}
                    <div>
                      <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Quantity</label>
                      <input
                        type="number"
                        name={`items[${i}][quantity]`}
                        min="1"
                        step="1"
                        value={item.quantity}
                        onChange={(e) => updateItem(i, "quantity", Number(e.target.value))}
                        className="w-full border rounded-md px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      />
                    </div>

                    {/* Unit Price */}
                    <div>
                      <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Unit Price ($)</label>
                      <input
                        type="number"
                        name={`items[${i}][unitPrice]`}
                        min="0"
                        step="0.01"
                        value={item.unitPrice}
                        onChange={(e) => updateItem(i, "unitPrice", e.target.value)}
                        className="w-full border rounded-md px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      />
                    </div>

                    {/* Discount % */}
                    <div>
                      <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Discount (%)</label>
                      <input
                        type="number"
                        name={`items[${i}][discount]`}
                        min="0"
                        max="100"
                        step="0.01"
                        value={item.discount}
                        onChange={(e) => updateItem(i, "discount", e.target.value)}
                        className="w-full border rounded-md px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      />
                    </div>
                  </div>

                  {/* Row subtotal */}
                  {item.unitPrice && (
                    <p className="text-xs text-right text-gray-500 dark:text-gray-400">
                      Line total: $
                      {(
                        (parseFloat(item.unitPrice) || 0) *
                        item.quantity *
                        (1 - (parseFloat(item.discount) || 0) / 100)
                      ).toFixed(2)}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
          <FieldError errors={state?.errors?.items} />
        </div>

        {/* Order Total Summary (display only) */}
        <div className="bg-gray-50 dark:bg-gray-700 rounded-md p-3 text-sm">
          <div className="flex justify-between font-semibold text-gray-900 dark:text-white">
            <span>Order Total</span>
            <span>${calculatedTotal.toFixed(2)}</span>
          </div>
        </div>

        {/* Status */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
          <select
            name="status"
            defaultValue={order?.status ?? "pending"}
            className="w-full border rounded-md px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          >
            {ORDER_STATUSES.map((s) => (
              <option key={s.id} value={s.id}>{s.label}</option>
            ))}
          </select>
        </div>

        {/* Estimated Delivery */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Estimated Delivery <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <input
            type="date"
            name="estimatedDelivery"
            defaultValue={deliveryDefault}
            className="w-full border rounded-md px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          />
        </div>

        {/* Assigned To */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Assigned To <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <input
            type="text"
            name="assignedTo"
            defaultValue={order?.assignedTo ?? ""}
            placeholder="unassigned"
            className="w-full border rounded-md px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          />
        </div>

        {/* Custom Design Text */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Custom Design Text <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <textarea
            name="customDesignText"
            rows={2}
            defaultValue={order?.customDesignText ?? ""}
            placeholder="e.g. Company name, slogan..."
            className="w-full border rounded-md px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          />
        </div>

        {/* Design Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Design Notes <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <textarea
            name="designNotes"
            rows={2}
            defaultValue={order?.designNotes ?? ""}
            placeholder="Internal notes for the design team..."
            className="w-full border rounded-md px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          />
        </div>

        {/* Custom Logo URL */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Custom Logo URL <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <input
            type="url"
            name="customLogoUrl"
            defaultValue={order?.customLogoUrl ?? ""}
            className="w-full border rounded-md px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          />
        </div>

        {/* Submit */}
        <div className="flex gap-3 pt-2">
          <Button type="submit" disabled={isPending} className="bg-blue-600 hover:bg-blue-700 text-white">
            {isPending ? "Saving..." : isEditing ? "Update Order" : "Create Order"}
          </Button>
          <Button asChild variant="outline" className="dark:text-white">
            <Link href="/orders">Cancel</Link>
          </Button>
        </div>

      </form>
    </div>
  );
}
```

---

## Step 8 — Update `app/(dashboard)/orders/page.tsx`

This page needs to:
1. Fetch order items joined to products for each order
2. Group items by `orderId`
3. Add an `OrderRow` client component that handles expand/collapse

### Data fetching (server component)

Replace the query in `OrdersPage` to also fetch items:

```ts
import { db } from "@/db";
import { orders, customers, orderItems, products } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ShoppingCart } from "lucide-react";
import { OrderRow } from "./OrderRow"; // new client component (see below)

export default async function OrdersPage() {
  const allOrders = await db
    .select({
      id: orders.id,
      status: orders.status,
      totalPrice: orders.totalPrice,
      estimatedDelivery: orders.estimatedDelivery,
      createdAt: orders.createdAt,
      customerFirstName: customers.firstName,
      customerLastName: customers.lastName,
    })
    .from(orders)
    .innerJoin(customers, eq(orders.customerId, customers.id))
    .orderBy(desc(orders.createdAt));

  const allItems = await db
    .select({
      orderId: orderItems.orderId,
      quantity: orderItems.quantity,
      selectedColor: orderItems.selectedColor,
      unitPrice: orderItems.unitPrice,
      discount: orderItems.discount,
      productName: products.name,
      productSize: products.size,
    })
    .from(orderItems)
    .innerJoin(products, eq(orderItems.productId, products.id));

  // Group items by orderId
  const itemsByOrder = allItems.reduce<Record<number, typeof allItems>>((acc, item) => {
    if (!acc[item.orderId]) acc[item.orderId] = [];
    acc[item.orderId].push(item);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Orders</h1>
          <p className="text-gray-600 dark:text-gray-300">
            {allOrders.length} order{allOrders.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Button asChild className="bg-blue-600 hover:bg-blue-700 text-white">
          <Link href="/orders/form">+ New Order</Link>
        </Button>
      </div>

      {allOrders.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-lg shadow-sm border">
          <ShoppingCart className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No orders yet</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">Create your first order to get started.</p>
          <Button asChild className="bg-blue-600 hover:bg-blue-700 text-white">
            <Link href="/orders/form">+ New Order</Link>
          </Button>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="w-8 px-4 py-3" />
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">#</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Customer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Items</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {allOrders.map((order) => (
                <OrderRow
                  key={order.id}
                  order={order}
                  items={itemsByOrder[order.id] ?? []}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
```

### New file: `app/(dashboard)/orders/OrderRow.tsx`

Create this new client component for the expandable rows:

```tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronRight } from "lucide-react";

const STATUS_CLASSES: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  design: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  production: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
  quality_check: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
  shipped: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300",
  delivered: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  canceled: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300",
};

const STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  design: "Design",
  production: "Production",
  quality_check: "Quality Check",
  shipped: "Shipped",
  delivered: "Delivered",
  canceled: "Canceled",
};

type OrderItem = {
  orderId: number;
  quantity: number;
  selectedColor: string;
  unitPrice: string | number;
  discount: string | number | null;
  productName: string;
  productSize: string;
};

type Order = {
  id: number;
  status: string;
  totalPrice: string | number;
  estimatedDelivery: Date | null;
  createdAt: Date;
  customerFirstName: string;
  customerLastName: string;
};

type Props = {
  order: Order;
  items: OrderItem[];
};

export function OrderRow({ order, items }: Props) {
  const [expanded, setExpanded] = useState(false);

  const subtotal = items.reduce((sum, item) => {
    const price = parseFloat(String(item.unitPrice)) || 0;
    const disc = parseFloat(String(item.discount ?? 0)) || 0;
    return sum + price * item.quantity * (1 - disc / 100);
  }, 0);

  return (
    <>
      {/* Main order row */}
      <tr
        className="hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
        onClick={() => setExpanded((v) => !v)}
      >
        <td className="px-4 py-4 text-gray-400">
          {expanded
            ? <ChevronDown className="h-4 w-4" />
            : <ChevronRight className="h-4 w-4" />}
        </td>
        <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">#{order.id}</td>
        <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
          {order.customerFirstName} {order.customerLastName}
        </td>
        <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
          {items.length} item{items.length !== 1 ? "s" : ""}
        </td>
        <td className="px-6 py-4">
          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_CLASSES[order.status] ?? ""}`}>
            {STATUS_LABELS[order.status] ?? order.status}
          </span>
        </td>
        <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
          ${Number(order.totalPrice).toFixed(2)}
        </td>
        <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
          {new Date(order.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
        </td>
        <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
          <Button asChild size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
            <Link href={`/orders/form?id=${order.id}`}>Edit</Link>
          </Button>
        </td>
      </tr>

      {/* Expanded items panel */}
      {expanded && (
        <tr>
          <td colSpan={8} className="px-6 pb-4 bg-gray-50 dark:bg-gray-900">
            <table className="min-w-full text-sm mt-2">
              <thead>
                <tr className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase border-b dark:border-gray-700">
                  <th className="pb-2 text-left">Product</th>
                  <th className="pb-2 text-left">Size</th>
                  <th className="pb-2 text-left">Color</th>
                  <th className="pb-2 text-right">Unit Price</th>
                  <th className="pb-2 text-right">Qty</th>
                  <th className="pb-2 text-right">Disc.</th>
                  <th className="pb-2 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {items.map((item, i) => {
                  const price = parseFloat(String(item.unitPrice)) || 0;
                  const disc = parseFloat(String(item.discount ?? 0)) || 0;
                  const lineTotal = price * item.quantity * (1 - disc / 100);
                  return (
                    <tr key={i}>
                      <td className="py-2 text-gray-900 dark:text-white font-medium">{item.productName}</td>
                      <td className="py-2 text-gray-600 dark:text-gray-400">{item.productSize}</td>
                      <td className="py-2 capitalize text-gray-600 dark:text-gray-400">{item.selectedColor}</td>
                      <td className="py-2 text-right text-gray-700 dark:text-gray-300">${price.toFixed(2)}</td>
                      <td className="py-2 text-right text-gray-700 dark:text-gray-300">×{item.quantity}</td>
                      <td className="py-2 text-right text-gray-500 dark:text-gray-400">
                        {disc > 0 ? `${disc}%` : "—"}
                      </td>
                      <td className="py-2 text-right font-medium text-gray-900 dark:text-white">${lineTotal.toFixed(2)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Summary */}
            <div className="mt-3 pt-3 border-t dark:border-gray-700 space-y-1 text-sm text-right">
              <div className="flex justify-end gap-16 text-gray-600 dark:text-gray-400">
                <span>Subtotal</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-end gap-16 font-semibold text-gray-900 dark:text-white">
                <span>Total</span>
                <span>${Number(order.totalPrice).toFixed(2)}</span>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
```

---

## Implementation Order

Run these steps in order:

1. Edit `db/schema.ts`
2. Create `db/migrations/0002_multi_item_orders.sql` + update `_journal.json`
3. Run `npm run db:migrate`
4. Edit `db/seed.ts`
5. Edit `zod-schema/order.ts`
6. Edit `app/(dashboard)/orders/actions.ts`
7. Edit `app/(dashboard)/orders/form/page.tsx`
8. Replace `app/(dashboard)/orders/form/OrderForm.tsx`
9. Create `app/(dashboard)/orders/OrderRow.tsx`
10. Replace `app/(dashboard)/orders/page.tsx`
11. Run `npm run dev` and test creating a new order with multiple items

---

## Using This File with Claude CLI

In your Claude Code session, reference this file at the start of your prompt:

```text
@markdown files/guides/multi-item-orders-implementation.md  implement step 1
```

Or to do all steps at once:

```text
@markdown files/guides/multi-item-orders-implementation.md  implement all steps in order
```
