# Coldest Products — Schema Update & Inventory Seed

**Branch:** `products-inventory-update`  
**Status:** Complete — superseded by a later schema change (see note below)

> **Update (2026-07-29):** `bottleSizeEnum` (shown below) and the `products.series` text column have since been replaced by `product_series`/`bottle_sizes` lookup tables — `products.size`/`products.series` no longer exist as columns; use `products.seriesId`/`products.sizeId` instead. This lets new series/sizes be added from the Add Product page without a migration. See `markdown files/debugging/Products_Data_Model.md` and `openspec/changes/product-design-catalog-restructure/` for the current schema and rationale. The code below is kept as-is for historical reference of this guide's original migration.

Updates the products schema to match Coldest's real product catalog, then seeds the database with all 10 product lines and their designs.

---

## Files Changing

1. `db/schema.ts`
2. `constants/ProductConstants.ts`
3. `zod-schema/product.ts`
4. `app/(dashboard)/products/actions.ts`
5. `app/(dashboard)/products/form/ProductForm.tsx`
6. `app/(dashboard)/products/page.tsx`
7. `db/seed.ts`

**Migration:** `npx drizzle-kit push` — safe to use since the products table is empty (placeholder seed data only).

---

## 1. `db/schema.ts`

```ts
import {
  pgTable,
  serial,
  varchar,
  boolean,
  timestamp,
  integer,
  text,
  decimal,
  pgEnum,
} from "drizzle-orm/pg-core";

import { relations } from "drizzle-orm";

// Enums

export const OrderStatusEnum = pgEnum("order_status", [
  "pending",
  "design",
  "production",
  "quality_check",
  "shipped",
  "delivered",
  "canceled"
]);

export const bottleSizeEnum = pgEnum("bottle_size", [
  "6.7oz",
  "15oz",
  "20oz",
  "24oz",
  "36oz",
  "46oz",
  "64oz",
  "128oz"
]);

export const bottleMaterialEnum = pgEnum("bottle_material", [
  "stainless_steel"
]);

export const customers = pgTable("customers", {
  id: serial("id").primaryKey(),
  firstName: varchar("first_name", { length: 255 }).notNull(),
  lastName: varchar("last_name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).unique().notNull(),
  phone: varchar("phone", { length: 20 }).notNull(),
  address1: varchar("address1", { length: 255 }).notNull(),
  address2: varchar("address2", { length: 255 }),
  city: varchar("city", { length: 100 }).notNull(),
  state: varchar("state", { length: 2 }).notNull(),
  zipCode: varchar("zip_code", { length: 10 }).notNull(),
  notes: text("notes"),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow().$onUpdate(() => new Date()),
});

// Products Table
export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  series: varchar("series", { length: 100 }).notNull(),
  size: bottleSizeEnum("size").notNull(),
  material: bottleMaterialEnum("material").notNull().default("stainless_steel"),
  basePrice: decimal("base_price", { precision: 10, scale: 2 }).notNull(),
  msrpPrice: decimal("msrp_price", { precision: 10, scale: 2 }),
  designs: text("designs").notNull(),               // JSON: [{ name: string, inStock: boolean }]
  features: text("features"),                        // JSON array of misc features
  hasHandle: boolean("has_handle").notNull().default(false),
  coldRetentionHours: integer("cold_retention_hours"),
  hotRetentionHours: integer("hot_retention_hours"),
  leakProof: boolean("leak_proof").notNull().default(false),
  warranty: varchar("warranty", { length: 100 }).default("lifetime"),
  rating: decimal("rating", { precision: 3, scale: 1 }),
  reviewCount: integer("review_count"),
  designTemplate: text("design_template"),
  designPreview: text("design_preview"),
  designVariations: text("design_variations"),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow().$onUpdate(() => new Date()),
});

// Orders table
export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  customerId: integer("customer_id")
    .notNull()
    .references(() => customers.id),
  customDesignText: text("custom_design_text"),
  customLogoUrl: text("custom_logo_url"),
  designNotes: text("design_notes"),
  designProofUrl: text("design_proof_url"),
  status: OrderStatusEnum("status").notNull().default("pending"),
  totalPrice: decimal("total_price", { precision: 10, scale: 2 }).notNull(),
  estimatedDelivery: timestamp("estimated_delivery"),
  trackingNumber: varchar("tracking_number", { length: 100 }),
  assignedTo: varchar("assigned_to", { length: 255 }).default("unassigned"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow().$onUpdate(() => new Date()),
});

export const orderItems = pgTable("order_items", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id")
    .notNull()
    .references(() => orders.id, { onDelete: "cascade" }),
  productId: integer("product_id")
    .notNull()
    .references(() => products.id),
  quantity: integer("quantity").notNull().default(1),
  selectedColor: varchar("selected_color", { length: 100 }).notNull(),
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).notNull(),
  discount: decimal("discount", { precision: 5, scale: 2 }).default("0"),
});

// Relations
export const customerRelations = relations(customers, ({ many }) => ({
  orders: many(orders),
}));

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

**What changed:**
- `bottleSizeEnum`: replaced 5 wrong sizes with 8 real Coldest sizes
- `bottleMaterialEnum`: down to `stainless_steel` only
- `products` table: added `series`, `msrpPrice`, `hasHandle`, `coldRetentionHours`, `hotRetentionHours`, `leakProof`, `warranty`, `rating`, `reviewCount`; renamed `colors` → `designs`; `material` now defaults to `stainless_steel`

---

## 2. `constants/ProductConstants.ts`

```ts
export const BottleSizes = [
  { id: "6.7oz", description: "6.7 oz (Mini)" },
  { id: "15oz", description: "15 oz" },
  { id: "20oz", description: "20 oz (Tumbler)" },
  { id: "24oz", description: "24 oz" },
  { id: "36oz", description: "36 oz" },
  { id: "46oz", description: "46 oz" },
  { id: "64oz", description: "64 oz (Half Gallon)" },
  { id: "128oz", description: "128 oz (Gallon)" },
];

export const ProductSeries = [
  { id: "Limitless Ultra v8", description: "Limitless Ultra v8" },
  { id: "Limitless Gallon", description: "Limitless Gallon" },
  { id: "Tumbler v2", description: "Tumbler v2" },
  { id: "Mini", description: "Mini" },
  { id: "Universal", description: "Universal" },
  { id: "First Responder", description: "First Responder" },
];

export const OrderStatuses = [
  { id: "pending", description: "Pending" },
  { id: "designing", description: "In Design" },
  { id: "production", description: "In Production" },
  { id: "quality_check", description: "Quality Check" },
  { id: "shipped", description: "Shipped" },
  { id: "delivered", description: "Delivered" },
  { id: "cancelled", description: "Cancelled" },
];
```

**What changed:** Updated `BottleSizes`, removed `BottleMaterials` and `AvailableColors`, added `ProductSeries`.

---

## 3. `zod-schema/product.ts`

```ts
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { products } from "@/db/schema";
import { z } from "zod";

export const insertProductSchema = createInsertSchema(products, {
  name: (schema) => schema.min(1, "Product name is required"),
  series: (schema) => schema.min(1, "Series is required"),
  basePrice: (schema) => schema.refine((val) => parseFloat(val) > 0, {
    message: "Base price must be greater than 0",
  }),
  designs: (schema) => schema.min(1, "At least one design must be specified"),
});

export const selectProductSchema = createSelectSchema(products);

export const productSchema = insertProductSchema.partial();

export type InsertProductType = z.infer<typeof insertProductSchema>;
export type SelectProductType = z.infer<typeof selectProductSchema>;

export const updateProductSchema = insertProductSchema.omit({
  createdAt: true,
  updatedAt: true,
});
export type updateProductType = z.infer<typeof updateProductSchema>;
```

**What changed:** `colors` → `designs` validation, added `series` required check.

---

## 4. `app/(dashboard)/products/actions.ts`

```ts
"use server";

import { db } from "@/db";
import { products } from "@/db/schema";
import { insertProductSchema, updateProductSchema } from "@/zod-schema/product";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

type FormState = {
  errors?: Record<string, string[]>;
} | null;

function parseFormData(formData: FormData) {
  const hasHandle = formData.get("hasHandle") === "true";
  const leakProof = formData.get("leakProof") === "true";
  const coldHours = formData.get("coldRetentionHours");
  const hotHours = formData.get("hotRetentionHours");
  const reviewCount = formData.get("reviewCount");
  const rating = formData.get("rating");
  const msrp = formData.get("msrpPrice");

  return {
    name: formData.get("name"),
    description: formData.get("description") || undefined,
    series: formData.get("series"),
    size: formData.get("size"),
    material: "stainless_steel" as const,
    basePrice: formData.get("basePrice"),
    msrpPrice: msrp ? String(msrp) : undefined,
    designs: formData.get("designs") as string,
    features: formData.get("features") || undefined,
    hasHandle,
    leakProof,
    coldRetentionHours: coldHours ? Number(coldHours) : undefined,
    hotRetentionHours: hotHours ? Number(hotHours) : undefined,
    warranty: formData.get("warranty") || "lifetime",
    rating: rating ? String(rating) : undefined,
    reviewCount: reviewCount ? Number(reviewCount) : undefined,
    designTemplate: formData.get("designTemplate") || undefined,
    designPreview: formData.get("designPreview") || undefined,
    designVariations: formData.get("designVariations") || undefined,
    active: formData.getAll("active").includes("true"),
  };
}

export async function createProduct(
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const { getUser } = getKindeServerSession();
  const user = await getUser();
  if (!user) throw new Error("Unauthorized");

  const raw = parseFormData(formData);
  const parsed = insertProductSchema.safeParse(raw);
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }
  try {
    await db.insert(products).values(parsed.data);
  } catch (e) {
    if (
      e instanceof Error &&
      "code" in e &&
      (e as { code: string }).code === "23505"
    ) {
      return { errors: { name: ["A product with this name already exists"] } };
    }
    throw e;
  }

  revalidatePath("/products");
  redirect("/products");
}

export async function updateProduct(
  id: number,
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const { getUser } = getKindeServerSession();
  const user = await getUser();
  if (!user) throw new Error("Unauthorized");

  const raw = parseFormData(formData);
  const parsed = updateProductSchema.safeParse(raw);
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  await db.update(products).set(parsed.data).where(eq(products.id, id));

  revalidatePath("/products");
  redirect("/products");
}
```

**What changed:** `colors` → `designs`, material hardcoded to `stainless_steel`, added new fields to `parseFormData`.

---

## 5. `app/(dashboard)/products/form/ProductForm.tsx`

```tsx
"use client";

import { useActionState } from "react";
import { createProduct, updateProduct } from "@/app/(dashboard)/products/actions";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { SelectProductType } from "@/zod-schema/product";
import { BottleSizes, ProductSeries } from "@/constants/ProductConstants";

type FormState = {
  errors?: Record<string, string[]>;
} | null;

function FieldError({ errors }: { errors?: string[] }) {
  if (!errors?.length) return null;
  return <p className="text-sm text-red-600 mt-1">{errors[0]}</p>;
}

type Props = {
  product?: SelectProductType | null;
};

export function ProductForm({ product }: Props) {
  const isEditing = Boolean(product);

  const action = isEditing
    ? updateProduct.bind(null, product!.id)
    : createProduct;

  const [state, formAction, isPending] = useActionState<FormState, FormData>(
    action,
    null
  );

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {isEditing ? "Edit Product" : "Add Product"}
        </h1>
        <Button asChild variant="outline" className="dark:text-white">
          <Link href="/products">Cancel</Link>
        </Button>
      </div>

      <form action={formAction} className="space-y-6 bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border">

        {/* Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Product Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="name"
            defaultValue={product?.name ?? ""}
            className="w-full border rounded-md px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          />
          <FieldError errors={state?.errors?.name} />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Description
          </label>
          <textarea
            name="description"
            rows={2}
            defaultValue={product?.description ?? ""}
            className="w-full border rounded-md px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          />
        </div>

        {/* Series + Size */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Series <span className="text-red-500">*</span>
            </label>
            <select
              name="series"
              defaultValue={product?.series ?? ""}
              className="w-full border rounded-md px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            >
              <option value="">Select series</option>
              {ProductSeries.map((s) => (
                <option key={s.id} value={s.id}>{s.description}</option>
              ))}
            </select>
            <FieldError errors={state?.errors?.series} />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Size <span className="text-red-500">*</span>
            </label>
            <select
              name="size"
              defaultValue={product?.size ?? ""}
              className="w-full border rounded-md px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            >
              <option value="">Select size</option>
              {BottleSizes.map((s) => (
                <option key={s.id} value={s.id}>{s.description}</option>
              ))}
            </select>
            <FieldError errors={state?.errors?.size} />
          </div>
        </div>

        {/* Sale Price + MSRP */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Sale Price ($) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              name="basePrice"
              step="0.01"
              min="0"
              defaultValue={product?.basePrice ?? ""}
              className="w-full border rounded-md px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
            <FieldError errors={state?.errors?.basePrice} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              MSRP ($) <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <input
              type="number"
              name="msrpPrice"
              step="0.01"
              min="0"
              defaultValue={product?.msrpPrice ?? ""}
              className="w-full border rounded-md px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
          </div>
        </div>

        {/* Cold + Hot Retention */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Cold Retention (hrs)
            </label>
            <input
              type="number"
              name="coldRetentionHours"
              defaultValue={product?.coldRetentionHours ?? ""}
              className="w-full border rounded-md px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Hot Retention (hrs)
            </label>
            <input
              type="number"
              name="hotRetentionHours"
              defaultValue={product?.hotRetentionHours ?? ""}
              className="w-full border rounded-md px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
          </div>
        </div>

        {/* Warranty */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Warranty
          </label>
          <input
            type="text"
            name="warranty"
            defaultValue={product?.warranty ?? "lifetime"}
            className="w-full border rounded-md px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          />
        </div>

        {/* Toggles */}
        <div className="flex gap-6">
          <div className="flex items-center gap-2">
            <input type="hidden" name="hasHandle" value="false" />
            <input
              type="checkbox"
              name="hasHandle"
              value="true"
              defaultChecked={product?.hasHandle ?? false}
              className="h-4 w-4"
            />
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Has Handle</label>
          </div>
          <div className="flex items-center gap-2">
            <input type="hidden" name="leakProof" value="false" />
            <input
              type="checkbox"
              name="leakProof"
              value="true"
              defaultChecked={product?.leakProof ?? false}
              className="h-4 w-4"
            />
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Leak Proof</label>
          </div>
        </div>

        {/* Designs JSON */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Designs (JSON) <span className="text-red-500">*</span>
          </label>
          <textarea
            name="designs"
            rows={4}
            defaultValue={product?.designs ?? ""}
            placeholder='[{"name":"Stealth Black Ultra","inStock":true},{"name":"Berry Bae Ultra","inStock":false}]'
            className="w-full border rounded-md px-3 py-2 text-sm font-mono dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          />
          <FieldError errors={state?.errors?.designs} />
        </div>

        {/* Active */}
        <div className="flex items-center gap-2">
          <input type="hidden" name="active" value="false" />
          <input
            type="checkbox"
            name="active"
            value="true"
            defaultChecked={product?.active ?? true}
            className="h-4 w-4"
          />
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Active</label>
        </div>

        {/* Submit */}
        <div className="flex gap-3 pt-2">
          <Button type="submit" disabled={isPending} className="bg-blue-600 hover:bg-blue-700 text-white">
            {isPending ? "Saving..." : isEditing ? "Update Product" : "Add Product"}
          </Button>
          <Button asChild variant="outline" className="dark:text-white">
            <Link href="/products">Cancel</Link>
          </Button>
        </div>

      </form>
    </div>
  );
}
```

**What changed:** Removed colors checkboxes and material dropdown; added series dropdown, MSRP field, retention hours, leak proof, has handle, warranty; designs is now a JSON textarea.

---

## 6. `app/(dashboard)/products/page.tsx`

```tsx
import { db } from "@/db";
import { products } from "@/db/schema";
import { desc } from "drizzle-orm";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Package } from "lucide-react";
import { TableHeading } from "@/components/ui/table-heading";

export default async function ProductsPage() {
  const allProducts = await db
    .select()
    .from(products)
    .orderBy(desc(products.createdAt));

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Products</h1>
          <p className="text-gray-600 dark:text-gray-300">
            {allProducts.length} product{allProducts.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Button asChild className="bg-blue-600 hover:bg-blue-700 text-white">
          <Link href="/products/form">+ Add Product</Link>
        </Button>
      </div>

      {/* Empty state */}
      {allProducts.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-lg shadow-sm border">
          <Package className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No products yet</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">Add your first product to get started.</p>
          <Button asChild className="bg-blue-600 hover:bg-blue-700 text-white">
            <Link href="/products/form">+ Add Product</Link>
          </Button>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border overflow-hidden">

          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <TableHeading label="Product" />
                  <TableHeading label="Series" />
                  <TableHeading label="Size" />
                  <TableHeading label="Price" />
                  <TableHeading label="Designs" />
                  <TableHeading label="Status" />
                  <TableHeading label="Action" align="right" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {allProducts.map((product) => {
                  let designCount = 0;
                  let inStockCount = 0;
                  try {
                    const parsed = JSON.parse(product.designs) as { name: string; inStock: boolean }[];
                    designCount = parsed.length;
                    inStockCount = parsed.filter((d) => d.inStock).length;
                  } catch { /* skip */ }

                  return (
                    <tr key={product.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">

                      {/* Name */}
                      <td className="px-6 py-4">
                        <p className="font-medium text-gray-900 dark:text-white">{product.name}</p>
                        {product.description && (
                          <p className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-xs">{product.description}</p>
                        )}
                      </td>

                      {/* Series */}
                      <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                        {product.series}
                      </td>

                      {/* Size */}
                      <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                        {product.size}
                      </td>

                      {/* Price */}
                      <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                        <span className="font-medium">${Number(product.basePrice).toFixed(2)}</span>
                        {product.msrpPrice && (
                          <span className="block text-xs text-gray-400 line-through">
                            ${Number(product.msrpPrice).toFixed(2)}
                          </span>
                        )}
                      </td>

                      {/* Designs */}
                      <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                        <span className="text-green-600 dark:text-green-400">{inStockCount} in stock</span>
                        <span className="text-gray-400"> / {designCount} total</span>
                      </td>

                      {/* Status badge */}
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${product.active
                          ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                          : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
                          }`}>
                          {product.active ? "Active" : "Inactive"}
                        </span>
                      </td>

                      {/* Edit */}
                      <td className="px-6 py-4 text-right">
                        <Button asChild size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
                          <Link href={`/products/form?id=${product.id}`}>Edit</Link>
                        </Button>
                      </td>

                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile card list */}
          <div className="md:hidden divide-y divide-gray-200 dark:divide-gray-700">
            {allProducts.map((product) => {
              let inStockCount = 0;
              let designCount = 0;
              try {
                const parsed = JSON.parse(product.designs) as { name: string; inStock: boolean }[];
                designCount = parsed.length;
                inStockCount = parsed.filter((d) => d.inStock).length;
              } catch { /* skip */ }

              return (
                <div key={product.id} className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{product.name}</p>
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${product.active
                        ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                        : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
                        }`}>
                        {product.active ? "Active" : "Inactive"}
                      </span>
                    </div>
                    <Button asChild size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
                      <Link href={`/products/form?id=${product.id}`}>Edit</Link>
                    </Button>
                  </div>
                  <div className="text-sm text-gray-700 dark:text-gray-300 space-y-1">
                    <p>{product.series} · {product.size}</p>
                    <p className="font-medium">${Number(product.basePrice).toFixed(2)}</p>
                    <p className="text-xs text-gray-400">{inStockCount} of {designCount} designs in stock</p>
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      )}
    </div>
  );
}
```

**What changed:** Removed Material column; added Series column; Price now shows sale + MSRP strikethrough; new Designs column shows in-stock count / total.

---

## 7. `db/seed.ts`

The seed replaces the two placeholder products with all 10 real Coldest product lines. Designs are stored as `[{ name, inStock }]` JSON, pulled from the spreadsheet.

> **Note:** Only a representative sample is shown below. The full implementation includes all 121 designs mapped to each applicable product. See `Coldest_Designs_Spreadsheet.md` for the complete cross-reference.

```ts
import { db } from "./index";
import { customers, products, orders, orderItems } from "./schema";

type Design = { name: string; inStock: boolean };

const main = async () => {
  console.log("Seeding database...");

  const productIds = await db.insert(products).values([
    {
      name: "Coldest Limitless Ultra v8 15oz",
      series: "Limitless Ultra v8",
      size: "15oz",
      material: "stainless_steel",
      basePrice: "44.99",
      msrpPrice: "53.99",
      hasHandle: true,
      leakProof: true,
      coldRetentionHours: 36,
      hotRetentionHours: 13,
      warranty: "lifetime",
      rating: "4.8",
      reviewCount: 842,
      designs: JSON.stringify([
        { name: "Stealth Black Ultra", inStock: true },
        { name: "Berry Bae Ultra", inStock: true },
        { name: "Glossy Pink Ultra", inStock: true },
        { name: "Crochet is Life Ultra", inStock: true },
        { name: "Mont Sainte Ultra", inStock: true },
        { name: "Clover Floral Ultra", inStock: true },
        { name: "Love Pop Ultra", inStock: true },
        { name: "Pursuit of winning Ultra", inStock: true },
        { name: "The World Stage Ultra", inStock: true },
        { name: "Water Lilies Ultra", inStock: true },
        { name: "Flirt & Flower Ultra", inStock: true },
        { name: "Mosaic Bloom Ultra", inStock: true },
        { name: "Green Dragon Ultra", inStock: true },
        { name: "Irises Ultra", inStock: true },
        { name: "Bouquet of Sunflowers Ultra", inStock: true },
        { name: "Love of Music Ultra", inStock: true },
        { name: "Magical Potions Ultra", inStock: true },
        { name: "Moonlight Mermaid Ultra", inStock: true },
        { name: "Aura Farming Ultra", inStock: true },
        { name: "Baby Dinosaur Ultra", inStock: true },
        { name: "XOXO Ultra", inStock: true },
        { name: "Across The Universe Ultra", inStock: false },
        { name: "Baby Birds Ultra", inStock: false },
        { name: "Baby Duckies Ultra", inStock: false },
        { name: "Baby Puppy Ultra", inStock: false },
        { name: "Blue Opal Ultra", inStock: false },
        { name: "But I'm Hungry Ultra", inStock: false },
        { name: "Buzzer Beater Ultra", inStock: false },
        { name: "Coldie Castle Ultra", inStock: false },
        { name: "Cuddly Puppy Ultra", inStock: false },
        { name: "Farther Away Ultra", inStock: false },
        { name: "Garden at Arles Ultra", inStock: false },
        { name: "Glowie Baby Fireflies Ultra", inStock: false },
        { name: "Glowie Snowflakes Ultra", inStock: false },
        { name: "Glowie Turtle Ultra", inStock: false },
        { name: "Gold Dragon Ultra", inStock: false },
        { name: "I Need Icecream Ultra", inStock: false },
        { name: "It's a Snowday Ultra", inStock: false },
        { name: "Kissed Dream Ultra", inStock: false },
        { name: "Moonlight Seashells Ultra", inStock: false },
        { name: "Pink Bows Ultra", inStock: false },
        { name: "Pink Petals Ultra", inStock: false },
        { name: "Polished Steel Ultra", inStock: false },
        { name: "Purple Moon Floral Ultra", inStock: false },
        { name: "Red Luna Ultra", inStock: false },
        { name: "Rocketship Alloy Ultra", inStock: false },
        { name: "Secret Garden Ultra", inStock: false },
        { name: "Soft Meadow Ultra", inStock: false },
        { name: "Starry Night Ultra", inStock: false },
        { name: "Starry Skulls Ultra", inStock: false },
        { name: "Stung by a bee Ultra", inStock: false },
        { name: "Taste of Fall Ultra", inStock: false },
        { name: "The Big Bang Ultra", inStock: false },
        { name: "The European Ultra", inStock: false },
        { name: "The Great Wave Ultra", inStock: false },
        { name: "The Hamilton Ultra", inStock: false },
        { name: "The Marrakech Ultra", inStock: false },
        { name: "The Moroccan Ultra", inStock: false },
        { name: "The Ottoman Ultra", inStock: false },
        { name: "The Persian Ultra", inStock: false },
        { name: "The Reader Ultra", inStock: false },
        { name: "Wizarding Skies Ultra", inStock: false },
      ] satisfies Design[]),
    },
    {
      name: "Coldest Limitless Ultra v8 24oz",
      series: "Limitless Ultra v8",
      size: "24oz",
      material: "stainless_steel",
      basePrice: "49.99",
      hasHandle: true,
      leakProof: true,
      coldRetentionHours: 36,
      hotRetentionHours: 13,
      warranty: "lifetime",
      rating: "4.8",
      reviewCount: 1575,
      designs: JSON.stringify([
        { name: "Berry Bae Ultra", inStock: true },
        { name: "Clover Floral Ultra", inStock: true },
        { name: "Crochet is Life Ultra", inStock: true },
        { name: "Flirt & Flower Ultra", inStock: true },
        { name: "Glossy Pink Ultra", inStock: true },
        { name: "Love Pop Ultra", inStock: true },
        { name: "Mont Sainte Ultra", inStock: true },
        { name: "Moonlight Mermaid Ultra", inStock: true },
        { name: "Mosaic Bloom Ultra", inStock: true },
        { name: "Pursuit of winning Ultra", inStock: true },
        { name: "Stealth Black Ultra", inStock: true },
        { name: "Taste of Fall Ultra", inStock: true },
        { name: "The Persian Ultra", inStock: true },
        { name: "The World Stage Ultra", inStock: true },
        { name: "Water Lilies Ultra", inStock: true },
        { name: "XOXO Ultra", inStock: true },
        { name: "Aura Farming Ultra", inStock: false },
        { name: "Baby Birds Ultra", inStock: false },
        { name: "Baby Dinosaur Ultra", inStock: false },
        { name: "Baby Duckies Ultra", inStock: false },
        { name: "Bouquet of Sunflowers Ultra", inStock: false },
        { name: "Buzzer Beater Ultra", inStock: false },
        { name: "Candy Hearts Ultra", inStock: false },
        { name: "Coldie Castle Ultra", inStock: false },
        { name: "Cuddly Puppy Ultra", inStock: false },
        { name: "Farther Away Ultra", inStock: false },
        { name: "Garden at Arles Ultra", inStock: false },
        { name: "Glowie Baby Fireflies Ultra", inStock: false },
        { name: "Glowie Snowflakes Ultra", inStock: false },
        { name: "Green Dragon Ultra", inStock: false },
        { name: "I need Icecream Ultra", inStock: false },
        { name: "Irises Ultra", inStock: false },
        { name: "It's a Snowday Ultra", inStock: false },
        { name: "Kissed Dream Ultra", inStock: false },
        { name: "Love of Music Ultra", inStock: false },
        { name: "Magical Potions Ultra", inStock: false },
        { name: "Moonlight Seashells Ultra", inStock: false },
        { name: "Pink Bows Ultra", inStock: false },
        { name: "Pink Petals Ultra", inStock: false },
        { name: "Polished Steel Ultra", inStock: false },
        { name: "Purple Moon Floral Ultra", inStock: false },
        { name: "Red Luna Ultra", inStock: false },
        { name: "Rocketship Alloy Ultra", inStock: false },
        { name: "Secret Garden Ultra", inStock: false },
        { name: "Soft Meadow Ultra", inStock: false },
        { name: "Starry Night Ultra", inStock: false },
        { name: "Starry Skulls Ultra", inStock: false },
        { name: "Stung by a bee Ultra", inStock: false },
        { name: "The Big Bang Ultra", inStock: false },
        { name: "The European Ultra", inStock: false },
        { name: "The Great Wave Ultra", inStock: false },
        { name: "The Hamilton Ultra", inStock: false },
        { name: "The Marrakech Ultra", inStock: false },
        { name: "The Moroccan Ultra", inStock: false },
        { name: "The Ottoman Ultra", inStock: false },
        { name: "The Reader Ultra", inStock: false },
        { name: "Wizarding Skies Ultra", inStock: false },
      ] satisfies Design[]),
    },
    {
      name: "Coldest Limitless Ultra v8 36oz",
      series: "Limitless Ultra v8",
      size: "36oz",
      material: "stainless_steel",
      basePrice: "54.99",
      msrpPrice: "68.24",
      hasHandle: true,
      leakProof: true,
      coldRetentionHours: 36,
      hotRetentionHours: 13,
      warranty: "lifetime",
      rating: "4.8",
      reviewCount: 2770,
      designs: JSON.stringify([
        { name: "Buzzer Beater Ultra", inStock: true },
        { name: "Clover Floral Ultra", inStock: true },
        { name: "Crochet is Life Ultra", inStock: true },
        { name: "Glossy Pink Ultra", inStock: true },
        { name: "Love Pop Ultra", inStock: true },
        { name: "Mont Sainte Ultra", inStock: true },
        { name: "Pursuit of winning Ultra", inStock: true },
        { name: "Stealth Black Ultra", inStock: true },
        { name: "The World Stage Ultra", inStock: true },
        { name: "Berry Bae Ultra", inStock: true },
        { name: "Across The Universe Ultra", inStock: false },
        { name: "Astroflora Ultra", inStock: false },
        { name: "Aura Farming Ultra", inStock: false },
        { name: "Baby Birds Ultra", inStock: false },
        { name: "Baby Duckies Ultra", inStock: false },
        { name: "Black Dress Ultra", inStock: false },
        { name: "Black and White Checkers Ultra", inStock: false },
        { name: "Blue Checkers Ultra", inStock: false },
        { name: "Blue Willow Ultra", inStock: false },
        { name: "Coldie Dream Ultra", inStock: false },
        { name: "Courting Couples Ultra", inStock: false },
        { name: "Cuddly Puppy Ultra", inStock: false },
        { name: "Deer Moon Ultra", inStock: false },
        { name: "Ember Glowie Ultra", inStock: false },
        { name: "Fantasy Nova Ultra", inStock: false },
        { name: "Flirt & Flower Ultra", inStock: false },
        { name: "Garden at Arles Ultra", inStock: false },
        { name: "Glowie Baby Fireflies Ultra", inStock: false },
        { name: "Glowie Dragon Ultra", inStock: false },
        { name: "Glowie Snowflakes Ultra", inStock: false },
        { name: "Glowie Spiral Ultra", inStock: false },
        { name: "Greatest Show Ultra", inStock: false },
        { name: "Green Dragon Ultra", inStock: false },
        { name: "I need Icecream Ultra", inStock: false },
        { name: "Imbued Nova Ultra", inStock: false },
        { name: "Irises Ultra", inStock: false },
        { name: "Karmic Popsicle Ultra", inStock: false },
        { name: "Love of Music Ultra", inStock: false },
        { name: "Magical Potions Ultra", inStock: false },
        { name: "Magnolia Bloom Ultra", inStock: false },
        { name: "Moonlight Mermaid Ultra", inStock: false },
        { name: "Moonlight Seashells Ultra", inStock: false },
        { name: "Mosaic Bloom Ultra", inStock: false },
        { name: "Pink Bows Ultra", inStock: false },
        { name: "Pink Reflection Ultra", inStock: false },
        { name: "Polished Steel Ultra", inStock: false },
        { name: "Purple Nova Ultra", inStock: false },
        { name: "Purple Oasis Ultra", inStock: false },
        { name: "Red Luna Ultra", inStock: false },
        { name: "Rocketship Alloy Ultra", inStock: false },
        { name: "Royal Blue Ultra", inStock: false },
        { name: "Secret Garden Ultra", inStock: false },
        { name: "Snuggle Red Ultra", inStock: false },
        { name: "Soft Meadow Ultra", inStock: false },
        { name: "Stained Glass Ultra", inStock: false },
        { name: "Starry Night Ultra", inStock: false },
        { name: "Stung by a bee Ultra", inStock: false },
        { name: "Summer Dress Ultra", inStock: false },
        { name: "The American Ultra", inStock: false },
        { name: "The Big Bang Ultra", inStock: false },
        { name: "The Dragonfly Ultra", inStock: false },
        { name: "The Great Wave Ultra", inStock: false },
        { name: "The Hamilton Ultra", inStock: false },
        { name: "The Marrakech Ultra", inStock: false },
        { name: "The Moroccan Ultra", inStock: false },
        { name: "The Ottoman Ultra", inStock: false },
        { name: "The Persian Ultra", inStock: false },
        { name: "Water Lilies Ultra", inStock: false },
        { name: "Wine and Willow Ultra", inStock: false },
        { name: "Wizarding Skies Ultra", inStock: false },
        { name: "XOXO Ultra", inStock: false },
      ] satisfies Design[]),
    },
    {
      name: "Coldest Limitless Ultra v8 46oz",
      series: "Limitless Ultra v8",
      size: "46oz",
      material: "stainless_steel",
      basePrice: "64.99",
      msrpPrice: "79.92",
      hasHandle: true,
      leakProof: true,
      coldRetentionHours: 36,
      hotRetentionHours: 13,
      warranty: "lifetime",
      rating: "4.8",
      reviewCount: 4550,
      designs: JSON.stringify([
        { name: "Astroflora Ultra", inStock: true },
        { name: "Berry Bae Ultra", inStock: false },
        { name: "Black and White Checkers Ultra", inStock: true },
        { name: "Blue Checkers Ultra", inStock: true },
        { name: "Blue Willow Ultra", inStock: true },
        { name: "Buzzer Beater Ultra", inStock: true },
        { name: "Clover Floral Ultra", inStock: true },
        { name: "Courting Couples Ultra", inStock: true },
        { name: "Crochet is Life Ultra", inStock: true },
        { name: "Cuddly Puppy Ultra", inStock: true },
        { name: "Ember Glowie Ultra", inStock: true },
        { name: "Flirt & Flower Ultra", inStock: true },
        { name: "Ghosts Ultra", inStock: true },
        { name: "Glossy Pink Ultra", inStock: true },
        { name: "Glowie Snowflakes Ultra", inStock: true },
        { name: "Glowie Spiral Ultra", inStock: true },
        { name: "Love Pop Ultra", inStock: true },
        { name: "Love of Music Ultra", inStock: true },
        { name: "Magnolia Bloom Ultra", inStock: true },
        { name: "Mont Sainte Ultra", inStock: true },
        { name: "Mosaic Bloom Ultra", inStock: true },
        { name: "Polished Steel Ultra", inStock: true },
        { name: "Pursuit of winning Ultra", inStock: true },
        { name: "Purple Oasis Ultra", inStock: true },
        { name: "Royal Blue Ultra", inStock: true },
        { name: "Snuggle Red Ultra", inStock: true },
        { name: "Stealth Black Ultra", inStock: true },
        { name: "Stung by a bee Ultra", inStock: true },
        { name: "Summer Dress Ultra", inStock: true },
        { name: "Taste of Fall Ultra", inStock: true },
        { name: "The Persian Ultra", inStock: true },
        { name: "The World Stage Ultra", inStock: true },
        { name: "Turtly Green Ultra", inStock: true },
        { name: "Water Lilies Ultra", inStock: true },
        { name: "Wine and Willow Ultra", inStock: true },
        { name: "XOXO Ultra", inStock: true },
        { name: "Across The Universe Ultra", inStock: false },
        { name: "Aura Farming Ultra", inStock: false },
        { name: "Baby Birds Ultra", inStock: false },
        { name: "Baby Duckies Ultra", inStock: false },
        { name: "Black Dress Ultra", inStock: false },
        { name: "Coldie Dream Ultra", inStock: false },
        { name: "Deer Moon Ultra", inStock: false },
        { name: "Fantasy Nova Ultra", inStock: false },
        { name: "Garden at Arles Ultra", inStock: false },
        { name: "Glowie Baby Fireflies Ultra", inStock: false },
        { name: "Glowie Dragon Ultra", inStock: false },
        { name: "Gold Mermaid Ultra", inStock: false },
        { name: "Greatest Show Ultra", inStock: false },
        { name: "Green Dragon Ultra", inStock: false },
        { name: "I need Icecream Ultra", inStock: false },
        { name: "Imbued Nova Ultra", inStock: false },
        { name: "Irises Ultra", inStock: false },
        { name: "Karmic Popsicle Ultra", inStock: false },
        { name: "Molten Ivory Ultra", inStock: false },
        { name: "Moonlight Mermaid Ultra", inStock: false },
        { name: "Moonlight Seashells Ultra", inStock: false },
        { name: "Pink Bows Ultra", inStock: false },
        { name: "Pink Reflections Ultra", inStock: false },
        { name: "Purple Nova Ultra", inStock: false },
        { name: "Red Luna Ultra", inStock: false },
        { name: "Rocketship Alloy Ultra", inStock: false },
        { name: "Secret Garden Ultra", inStock: false },
        { name: "Snowstorm Floral Ultra", inStock: false },
        { name: "Soft Meadow Ultra", inStock: false },
        { name: "Stained Glass Ultra", inStock: false },
        { name: "Starry Night Ultra", inStock: false },
        { name: "The American Ultra", inStock: false },
        { name: "The Big Bang Ultra", inStock: false },
        { name: "The Dragonfly Ultra", inStock: false },
        { name: "The Great Wave Ultra", inStock: false },
        { name: "The Hamilton Ultra", inStock: false },
        { name: "The Marrakech Ultra", inStock: false },
        { name: "The Moroccan Ultra", inStock: false },
        { name: "The Ottoman Ultra", inStock: false },
        { name: "The Reader Ultra", inStock: false },
        { name: "Wizarding Skies Ultra", inStock: false },
      ] satisfies Design[]),
    },
    {
      name: "Coldest Tumbler v2 20oz",
      series: "Tumbler v2",
      size: "20oz",
      material: "stainless_steel",
      basePrice: "29.99",
      msrpPrice: "40.00",
      hasHandle: false,
      leakProof: false,
      coldRetentionHours: 36,
      hotRetentionHours: 13,
      warranty: "lifetime",
      rating: "4.8",
      reviewCount: 930,
      designs: JSON.stringify([
        { name: "Aura Farming Ultra", inStock: true },
        { name: "Baby Dinosaur Ultra", inStock: true },
        { name: "Baby Puppy Ultra", inStock: true },
        { name: "Berry Bae Ultra", inStock: true },
        { name: "Blue Opal Ultra", inStock: true },
        { name: "Bouquet of Sunflowers Ultra", inStock: true },
        { name: "Buzzer Beater Ultra", inStock: true },
        { name: "Clover Floral Ultra", inStock: true },
        { name: "Crochet is Life Ultra", inStock: true },
        { name: "Flirt & Flower Ultra", inStock: true },
        { name: "Glossy Pink Ultra", inStock: true },
        { name: "Glowie Snowflakes Ultra", inStock: true },
        { name: "Glowie Spiral Ultra", inStock: true },
        { name: "Green Dragon Ultra", inStock: true },
        { name: "Irises Ultra", inStock: true },
        { name: "Love Pop Ultra", inStock: true },
        { name: "Love of Music Ultra", inStock: true },
        { name: "Magical Potions", inStock: true },
        { name: "Magnolia Bloom Ultra", inStock: true },
        { name: "Mont Sainte Ultra", inStock: true },
        { name: "Moonlight Mermaid Ultra", inStock: true },
        { name: "Mosaic Bloom Ultra", inStock: true },
        { name: "Pursuit of winning Ultra", inStock: true },
        { name: "Red Dragon Ultra", inStock: true },
        { name: "Red Luna Ultra", inStock: true },
        { name: "Stealth Black Ultra", inStock: true },
        { name: "Stung by a bee Ultra", inStock: true },
        { name: "The Persian Ultra", inStock: true },
        { name: "The World Stage Ultra", inStock: true },
        { name: "Water Lilies Ultra", inStock: true },
        { name: "XOXO Ultra", inStock: true },
        { name: "Baby Birds Ultra", inStock: false },
        { name: "Baby Duckies Ultra", inStock: false },
        { name: "Baby Paws Ultra", inStock: false },
        { name: "Candy Hearts Ultra", inStock: false },
        { name: "Coldie Castle Ultra", inStock: false },
        { name: "Farther Away Ultra", inStock: false },
        { name: "Garden at Arles Ultra", inStock: false },
        { name: "Glowie Baby Fireflies Ultra", inStock: false },
        { name: "Glowie Turtle Ultra", inStock: false },
        { name: "Haunted Webs Ultra", inStock: false },
        { name: "It's a Snowday Ultra", inStock: false },
        { name: "Mr. Snowie Ultra", inStock: false },
        { name: "Moonlight Seashells Ultra", inStock: false },
        { name: "Pink Bows Ultra", inStock: false },
        { name: "Rocketship Alloy Ultra", inStock: false },
        { name: "Secret Garden Ultra", inStock: false },
        { name: "Snowstorm Floral Ultra", inStock: false },
        { name: "Soft Meadow Ultra", inStock: false },
        { name: "Starry Night Ultra", inStock: false },
        { name: "Starry Skulls Ultra", inStock: false },
        { name: "The American Ultra", inStock: false },
        { name: "The Big Bang Ultra", inStock: false },
        { name: "The Dragonfly Ultra", inStock: false },
        { name: "The Great Wave Ultra", inStock: false },
        { name: "The Hamilton Ultra", inStock: false },
        { name: "The Marrakech Ultra", inStock: false },
        { name: "The Morrocan Ultra", inStock: false },
        { name: "The Ottoman Ultra", inStock: false },
        { name: "The Reader Ultra", inStock: false },
        { name: "Wizarding Skies Ultra", inStock: false },
      ] satisfies Design[]),
    },
    {
      name: "Coldest Mini 6.7oz",
      series: "Mini",
      size: "6.7oz",
      material: "stainless_steel",
      basePrice: "29.99",
      hasHandle: false,
      leakProof: true,
      coldRetentionHours: 36,
      hotRetentionHours: 13,
      warranty: "lifetime",
      rating: "4.7",
      reviewCount: 1082,
      designs: JSON.stringify([
        { name: "Baby Dinosaur Ultra", inStock: true },
        { name: "Berry Bae Ultra", inStock: true },
        { name: "Candy Hearts Ultra", inStock: true },
        { name: "Crochet is Life Ultra", inStock: true },
        { name: "Ghosts Ultra", inStock: true },
        { name: "Glossy Pink Ultra", inStock: true },
        { name: "Glowie Butterflies Ultra", inStock: true },
        { name: "Glowie Snowflakes Ultra", inStock: true },
        { name: "Glowie Turtle Ultra", inStock: true },
        { name: "Green Dragon Ultra", inStock: true },
        { name: "Snuggle Red Ultra", inStock: true },
        { name: "Stealth Black Ultra", inStock: true },
        { name: "XOXO Ultra", inStock: true },
        { name: "Baby Duckies Ultra", inStock: false },
        { name: "Glowie Baby Fireflies", inStock: false },
        { name: "Karmic Popsicle Ultra", inStock: false },
        { name: "Moonlight Seashells Ultra", inStock: false },
        { name: "Pink Bows Ultra", inStock: false },
        { name: "Pursuit of winning Ultra", inStock: false },
        { name: "Rocketship Alloy Ultra", inStock: false },
        { name: "Secret Garden Ultra", inStock: false },
        { name: "Soft Meadow Ultra", inStock: false },
        { name: "The Big Bang", inStock: false },
        { name: "The World Stage Ultra", inStock: false },
      ] satisfies Design[]),
    },
    {
      name: "Coldest Limitless Gallon 128oz",
      series: "Limitless Gallon",
      size: "128oz",
      material: "stainless_steel",
      basePrice: "114.99",
      msrpPrice: "129.99",
      hasHandle: true,
      leakProof: true,
      coldRetentionHours: 100,
      hotRetentionHours: 13,
      warranty: "lifetime",
      rating: "4.8",
      reviewCount: 350,
      designs: JSON.stringify([
        { name: "Berry Bae Ultra", inStock: true },
        { name: "Blue Opal Ultra", inStock: true },
        { name: "Ghosts Ultra", inStock: true },
        { name: "Gold Dragon Ultra", inStock: true },
        { name: "Magical Potions Ultra", inStock: true },
        { name: "Pink Petals Ultra", inStock: true },
        { name: "Pursuit of winning Ultra", inStock: true },
        { name: "Starry Night Ultra", inStock: true },
        { name: "Stealth Black Ultra", inStock: true },
        { name: "The European Ultra", inStock: true },
        { name: "The Marrakech Ultra", inStock: true },
        { name: "The World Stage Ultra", inStock: true },
        { name: "Buzzer Beater Ultra", inStock: false },
        { name: "Candy Cane Ultra", inStock: false },
        { name: "Cuddly Puppy Ultra", inStock: false },
        { name: "Farther Away Ultra", inStock: false },
        { name: "I need Icecream Ultra", inStock: false },
        { name: "Love Pop Ultra", inStock: false },
        { name: "Secret Garden Ultra", inStock: false },
        { name: "The American Ultra", inStock: false },
        { name: "The Big Bang Ultra", inStock: false },
        { name: "The Great Wave Ultra", inStock: false },
        { name: "The Hamilton Ultra", inStock: false },
        { name: "The Ottoman Ultra", inStock: false },
        { name: "Wizarding Skies Ultra", inStock: false },
      ] satisfies Design[]),
    },
    {
      name: "Coldest Universal 36oz",
      series: "Universal",
      size: "36oz",
      material: "stainless_steel",
      basePrice: "45.99",
      msrpPrice: "49.99",
      hasHandle: false,
      leakProof: true,
      coldRetentionHours: 36,
      hotRetentionHours: 13,
      warranty: "lifetime",
      rating: "4.8",
      reviewCount: 725,
      designs: JSON.stringify([
        { name: "Irises v2", inStock: true },
        { name: "Pink Reflections", inStock: false },
        { name: "Stealth Black", inStock: false },
        { name: "The Marrakech v2", inStock: false },
      ] satisfies Design[]),
    },
    {
      name: "Coldest First Responder 36oz",
      series: "First Responder",
      size: "36oz",
      material: "stainless_steel",
      basePrice: "68.00",
      msrpPrice: "75.00",
      hasHandle: true,
      leakProof: true,
      coldRetentionHours: 36,
      hotRetentionHours: 13,
      warranty: "lifetime",
      designs: JSON.stringify([
        { name: "911 Dispatchers", inStock: true },
        { name: "Air Force", inStock: true },
        { name: "Army", inStock: true },
        { name: "Corrections", inStock: true },
        { name: "Firefighters", inStock: true },
        { name: "Marines", inStock: true },
        { name: "Navy", inStock: true },
        { name: "Nurses & Healthcare", inStock: true },
        { name: "Paramedic", inStock: true },
        { name: "Police", inStock: true },
      ] satisfies Design[]),
    },
    {
      name: "Coldest First Responder 46oz",
      series: "First Responder",
      size: "46oz",
      material: "stainless_steel",
      basePrice: "75.00",
      msrpPrice: "75.00",
      hasHandle: true,
      leakProof: true,
      coldRetentionHours: 36,
      hotRetentionHours: 13,
      warranty: "lifetime",
      designs: JSON.stringify([
        { name: "911 Dispatchers", inStock: true },
        { name: "Air Force", inStock: true },
        { name: "Army", inStock: true },
        { name: "Corrections", inStock: true },
        { name: "Firefighters", inStock: true },
        { name: "Marines", inStock: true },
        { name: "Navy", inStock: true },
        { name: "Nurses & Healthcare", inStock: true },
        { name: "Paramedic", inStock: true },
        { name: "Police", inStock: true },
      ] satisfies Design[]),
    },
  ]).returning({ id: products.id });

  // Seed customers
  const customerIds = await db.insert(customers).values([
    {
      firstName: "Sarah",
      lastName: "Johnson",
      email: "sarah.johnson@example.com",
      phone: "555-123-4567",
      address1: "123 Fitness Ave",
      city: "Austin",
      state: "TX",
      zipCode: "78701",
      notes: "Prefers eco-friendly products",
    },
    {
      firstName: "Mike",
      lastName: "Chen",
      email: "mike.chen@example.com",
      phone: "555-987-6543",
      address1: "456 Wellness St",
      city: "San Francisco",
      state: "CA",
      zipCode: "94105",
      notes: "Corporate bulk orders",
    },
  ]).returning({ id: customers.id });

  // Seed orders
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
      selectedColor: "Stealth Black Ultra",
      unitPrice: "44.99",
      discount: "0",
    },
    {
      orderId: orderIds[1].id,
      productId: productIds[1].id,
      quantity: 50,
      selectedColor: "Berry Bae Ultra",
      unitPrice: "49.99",
      discount: "0",
    },
  ]);

  console.log("Seeding completed");
};

main().catch((error) => {
  console.error("Error during seeding:", error);
  process.exit(1);
});
```

---

## Migration Steps

```bash
# 1. Push schema to DB (safe — products table is placeholder data only)
npx drizzle-kit push

# 2. Run seed
npx tsx db/seed.ts
```

> If `drizzle-kit push` complains about removing enum values, run it with `--force` or manually drop and recreate the products table first.
