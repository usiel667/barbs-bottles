"use server";

import { db } from "@/db";
import { products, productDesigns, productSeries, bottleSizes } from "@/db/schema";
import { insertProductSchema, updateProductSchema } from "@/zod-schema/product";
import { insertProductDesignSchema } from "@/zod-schema/productDesign";
import { insertProductSeriesSchema } from "@/zod-schema/productSeries";
import { insertBottleSizeSchema } from "@/zod-schema/bottleSize";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { eq, ilike } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

type FormState = {
  errors?: Record<string, string[]>;
} | null;

const designRowSchema = insertProductDesignSchema.omit({ productId: true });
type DesignRow = z.infer<typeof designRowSchema>;

function parseFormData(formData: FormData) {
  const hasHandle = formData.get("hasHandle") === "true";
  const leakProof = formData.get("leakProof") === "true";
  const coldHours = formData.get("coldRetentionHours");
  const hotHours = formData.get("hotRetentionHours");
  const reviewCount = formData.get("reviewCount");
  const rating = formData.get("rating");

  const seriesId = formData.get("seriesId");
  const sizeId = formData.get("sizeId");

  return {
    name: formData.get("name"),
    description: formData.get("description") || undefined,
    seriesId: seriesId ? Number(seriesId) : undefined,
    sizeId: sizeId ? Number(sizeId) : undefined,
    material: "stainless_steel" as const,
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

function parseDesignRows(formData: FormData) {
  const count = Number(formData.get("designCount") || 0);
  return Array.from({ length: count }, (_, i) => ({
    name: formData.get(`designs[${i}][name]`),
    price: formData.get(`designs[${i}][price]`),
    msrpPrice: formData.get(`designs[${i}][msrpPrice]`) || undefined,
    inStock: formData.get(`designs[${i}][inStock]`) === "true",
    quantity: Number(formData.get(`designs[${i}][quantity]`) || 0),
  }));
}

function validateDesignRows(
  rows: ReturnType<typeof parseDesignRows>
): { errors: Record<string, string[]> } | { data: DesignRow[] } {
  if (rows.length === 0) {
    return { errors: { designs: ["At least one design is required"] } };
  }

  const data: DesignRow[] = [];
  const rowErrors: string[] = [];
  rows.forEach((row, i) => {
    const parsed = designRowSchema.safeParse(row);
    if (!parsed.success) {
      rowErrors.push(
        `Design ${i + 1}: ${Object.values(parsed.error.flatten().fieldErrors).flat().join(", ")}`
      );
    } else {
      data.push(parsed.data);
    }
  });

  if (rowErrors.length > 0) {
    return { errors: { designs: rowErrors } };
  }

  const seenNames = new Set<string>();
  for (const d of data) {
    if (seenNames.has(d.name)) {
      return { errors: { designs: [`Duplicate design name: "${d.name}"`] } };
    }
    seenNames.add(d.name);
  }

  return { data };
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
    return { errors: parsed.error.flatten(i => i.message).fieldErrors };
  }

  const designsResult = validateDesignRows(parseDesignRows(formData));
  if ("errors" in designsResult) {
    return { errors: designsResult.errors };
  }

  try {
    const [product] = await db.insert(products).values(parsed.data).returning();
    await db.insert(productDesigns).values(
      designsResult.data.map((d) => ({ ...d, productId: product.id }))
    );
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
    return { errors: parsed.error.flatten(i => i.message).fieldErrors };
  }

  const designsResult = validateDesignRows(parseDesignRows(formData));
  if ("errors" in designsResult) {
    return { errors: designsResult.errors };
  }

  try {
    await db.update(products).set(parsed.data).where(eq(products.id, id));
    await db.delete(productDesigns).where(eq(productDesigns.productId, id));
    await db.insert(productDesigns).values(
      designsResult.data.map((d) => ({ ...d, productId: id }))
    );
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

type LookupActionResult<T> =
  | { data: T }
  | { error: string };

export async function createProductSeries(
  name: string
): Promise<LookupActionResult<{ id: number; name: string }>> {
  const { getUser } = getKindeServerSession();
  const user = await getUser();
  if (!user) throw new Error("Unauthorized");

  const parsed = insertProductSeriesSchema.safeParse({ name });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid series name" };
  }

  const existing = await db
    .select({ id: productSeries.id, name: productSeries.name })
    .from(productSeries)
    .where(ilike(productSeries.name, parsed.data.name))
    .limit(1);
  if (existing.length) {
    return { error: `Series "${existing[0].name}" already exists` };
  }

  const [created] = await db
    .insert(productSeries)
    .values(parsed.data)
    .returning({ id: productSeries.id, name: productSeries.name });

  revalidatePath("/products/form");
  return { data: created };
}

export async function createBottleSize(
  code: string,
  description: string
): Promise<LookupActionResult<{ id: number; code: string; description: string }>> {
  const { getUser } = getKindeServerSession();
  const user = await getUser();
  if (!user) throw new Error("Unauthorized");

  const parsed = insertBottleSizeSchema.safeParse({ code, description });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid size" };
  }

  const existing = await db
    .select({ id: bottleSizes.id, code: bottleSizes.code })
    .from(bottleSizes)
    .where(ilike(bottleSizes.code, parsed.data.code))
    .limit(1);
  if (existing.length) {
    return { error: `Size "${existing[0].code}" already exists` };
  }

  const [created] = await db
    .insert(bottleSizes)
    .values(parsed.data)
    .returning({ id: bottleSizes.id, code: bottleSizes.code, description: bottleSizes.description });

  revalidatePath("/products/form");
  return { data: created };
}

const variantUpdateSchema = z.object({
  productDesignId: z.number().int().positive(),
  productId: z.number().int().positive(),
  price: z.string().refine((val) => parseFloat(val) > 0, {
    message: "Price must be greater than 0",
  }),
  msrpPrice: z.string().optional(),
  quantity: z.number().int().min(0, "Quantity cannot be negative"),
  active: z.boolean(),
});
export type VariantUpdate = z.infer<typeof variantUpdateSchema>;

// Bulk design editor: updates every series/size variant of one design together.
// The neon-http driver has no db.transaction() support, so db.batch() (Neon's
// HTTP transaction endpoint) is used instead for all-or-nothing semantics.
export async function updateDesignVariants(
  updates: VariantUpdate[]
): Promise<{ error: string } | { success: true }> {
  const { getUser } = getKindeServerSession();
  const user = await getUser();
  if (!user) throw new Error("Unauthorized");

  if (updates.length === 0) return { success: true };

  const parsedRows = updates.map((u) => variantUpdateSchema.safeParse(u));
  const firstError = parsedRows.find((p) => !p.success);
  if (firstError && !firstError.success) {
    return { error: firstError.error.issues[0]?.message ?? "Invalid variant data" };
  }
  const rows = parsedRows.map((p) => (p as { success: true; data: VariantUpdate }).data);

  const designQueries = rows.map((r) =>
    db
      .update(productDesigns)
      .set({
        price: r.price,
        msrpPrice: r.msrpPrice || null,
        quantity: r.quantity,
        inStock: r.quantity > 0,
      })
      .where(eq(productDesigns.id, r.productDesignId))
  );
  const productQueries = rows.map((r) =>
    db.update(products).set({ active: r.active }).where(eq(products.id, r.productId))
  );

  await db.batch([designQueries[0], ...designQueries.slice(1), ...productQueries] as never);

  revalidatePath("/products");
  return { success: true };
}

function parseVariantFormData(formData: FormData) {
  const coldHours = formData.get("coldRetentionHours");
  const hotHours = formData.get("hotRetentionHours");

  return {
    name: formData.get("name") as string,
    designName: formData.get("designName") as string,
    coldRetentionHours: coldHours ? Number(coldHours) : undefined,
    hotRetentionHours: hotHours ? Number(hotHours) : undefined,
    warranty: (formData.get("warranty") as string) || "lifetime",
    hasHandle: formData.get("hasHandle") === "true",
    leakProof: formData.get("leakProof") === "true",
    price: formData.get("price") as string,
    msrpPrice: (formData.get("msrpPrice") as string) || undefined,
    quantity: Number(formData.get("quantity") || 0),
    active: formData.getAll("active").includes("true"),
  };
}

const variantEditSchema = z.object({
  name: z.string().min(1, "Product name is required"),
  designName: z.string().min(1, "Design name is required"),
  coldRetentionHours: z.number().optional(),
  hotRetentionHours: z.number().optional(),
  warranty: z.string().optional(),
  hasHandle: z.boolean(),
  leakProof: z.boolean(),
  price: z.string().refine((val) => parseFloat(val) > 0, {
    message: "Price must be greater than 0",
  }),
  msrpPrice: z.string().optional(),
  quantity: z.number().int().min(0, "Quantity cannot be negative"),
  active: z.boolean(),
});

// Single-variant editor: Series/Size are not editable here (see design.md
// Decision 6) — changing either identifies a different product row, which
// belongs in "Add Product" instead. Cold/Hot Retention, Warranty, Has Handle,
// and Leak Proof live on the shared `products` row, so editing them here
// also applies to every sibling design on that same product (Decision 8).
export async function updateProductDesignVariant(
  productDesignId: number,
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const { getUser } = getKindeServerSession();
  const user = await getUser();
  if (!user) throw new Error("Unauthorized");

  const raw = parseVariantFormData(formData);
  const parsed = variantEditSchema.safeParse(raw);
  if (!parsed.success) {
    return { errors: parsed.error.flatten(i => i.message).fieldErrors };
  }

  const [design] = await db
    .select({ productId: productDesigns.productId })
    .from(productDesigns)
    .where(eq(productDesigns.id, productDesignId))
    .limit(1);
  if (!design) {
    return { errors: { name: ["Design not found"] } };
  }

  await db
    .update(products)
    .set({
      name: parsed.data.name,
      coldRetentionHours: parsed.data.coldRetentionHours,
      hotRetentionHours: parsed.data.hotRetentionHours,
      warranty: parsed.data.warranty,
      hasHandle: parsed.data.hasHandle,
      leakProof: parsed.data.leakProof,
      active: parsed.data.active,
    })
    .where(eq(products.id, design.productId));

  await db
    .update(productDesigns)
    .set({
      name: parsed.data.designName,
      price: parsed.data.price,
      msrpPrice: parsed.data.msrpPrice || null,
      quantity: parsed.data.quantity,
      inStock: parsed.data.quantity > 0,
    })
    .where(eq(productDesigns.id, productDesignId));

  revalidatePath("/products");
  redirect("/products");
}

// Deletes this design variant; if it was the last design on its product row,
// the product row is deleted too (see design.md, design-variant-editor spec).
export async function removeProductDesignVariant(productDesignId: number): Promise<{ error: string } | void> {
  const { getUser } = getKindeServerSession();
  const user = await getUser();
  if (!user) throw new Error("Unauthorized");

  const [design] = await db
    .select({ productId: productDesigns.productId })
    .from(productDesigns)
    .where(eq(productDesigns.id, productDesignId))
    .limit(1);
  if (!design) {
    return { error: "Design not found" };
  }

  await db.delete(productDesigns).where(eq(productDesigns.id, productDesignId));

  const remaining = await db
    .select({ id: productDesigns.id })
    .from(productDesigns)
    .where(eq(productDesigns.productId, design.productId))
    .limit(1);
  if (remaining.length === 0) {
    await db.delete(products).where(eq(products.id, design.productId));
  }

  revalidatePath("/products");
  redirect("/products");
}
