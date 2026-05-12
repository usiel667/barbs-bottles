"use server";

import { db } from "@/db";
import { orders } from "@/db/schema";
import { insertOrderSchema, updateOrderSchema } from "@/zod-schema/order";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

type FormState = {
  errors?: Record<string, string[]>;
} | null;

function parseFormData(formData: FormData) {
  const estimatedDeliveryRaw = formData.get("estimatedDelivery") as string | null;
  return {
    customerId: Number(formData.get("customerId")),
    productId: Number(formData.get("productId")),
    quantity: Number(formData.get("quantity") ?? 1),
    selectedColor: formData.get("selectedColor"),
    customDesignText: formData.get("customDesignText") || undefined,
    customLogoUrl: formData.get("customLogoUrl") || undefined,
    designNotes: formData.get("designNotes") || undefined,
    designProofUrl: formData.get("designProofUrl") || undefined,
    status: formData.get("status"),
    totalPrice: formData.get("totalPrice"),
    estimatedDelivery: estimatedDeliveryRaw ? new Date(estimatedDeliveryRaw) : undefined,
    assignedTo: formData.get("assignedTo") || "unassigned",
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

  await db.insert(orders).values(parsed.data);

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

  await db.update(orders).set(parsed.data).where(eq(orders.id, id));

  revalidatePath("/orders");
  redirect("/orders");
}
