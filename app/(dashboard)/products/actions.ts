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
  return {
    name: formData.get("name"),
    description: formData.get("description") || undefined,
    size: formData.get("size"),
    material: formData.get("material"),
    basePrice: formData.get("basePrice"),
    colors: JSON.stringify(formData.getAll("colors")),
    features: formData.get("features") || undefined,
    desingTemplates: formData.get("desingTemplate") || undefined,
    designPreview: formData.get("designPreview") || undefined,
    designVariations: formData.get("designVariations") || undefined,
    active: formData.get("active") === "true",
  };
}

export async function createProduct(
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  // Validate user session
  const { getUser } = getKindeServerSession();
  const user = await getUser();
  if (!user) throw new Error("Unauthorized");

  const raw = parseFormData(formData);
  const parsed = insertProductSchema.safeParse(raw);
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };

  }
  await db.insert(products).values(parsed.data);

  revalidatePath("/products");
  redirect("/products");

}
export async function updateProduct(
  id: number,
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  // Validate user session
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
