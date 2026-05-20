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
    const discount = parseFloat(item.discount) || 0;
    return sum + price * item.quantity * (1 - discount / 100);
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
    // totalPrice is computed server side, never taken from client
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

  //Replace all items for this order
  await db.delete(orderItems).where(eq(orderItems.orderId, id));
  await db.insert(orderItems).values(
    items.map((item) => ({ ...item, orderId: id }))
  );

  revalidatePath("/orders");
  redirect("/orders");
}
