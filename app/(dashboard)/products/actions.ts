"use server";

import { db } from "@/db";
import { products, productDesigns } from "@/db/schema";
import { insertProductSchema, updateProductSchema } from "@/zod-schema/product";
import { insertProductDesignSchema } from "@/zod-schema/productDesign";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { eq } from "drizzle-orm";
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

  return {
    name: formData.get("name"),
    description: formData.get("description") || undefined,
    series: formData.get("series"),
    size: formData.get("size"),
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
