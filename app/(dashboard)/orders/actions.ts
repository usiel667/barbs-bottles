"use server";

import { db } from "@/db";
import { orders, orderItems, productDesigns } from "@/db/schema";
import { insertOrderSchema, updateOrderSchema } from "@/zod-schema/order";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { eq, inArray } from "drizzle-orm";
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
    shippingAddress1: formData.get("shippingAddress1"),
    shippingAddress2: formData.get("shippingAddress2") || undefined,
    shippingCity: formData.get("shippingCity"),
    shippingState: formData.get("shippingState"),
    shippingZipCode: formData.get("shippingZipCode"),
    status: formData.get("status"),
    // totalPrice is computed server side, never taken from client
    totalPrice: computeTotal(items),
    estimatedDelivery: estimatedDeliveryRaw ? new Date(estimatedDeliveryRaw) : undefined,
    assignedTo: formData.get("assignedTo") || "unassigned",
    items,
  };
}

type StockLineItem = { productId: number; selectedColor: string; quantity: number };

// Bug 11 (markdown files/debugging/Bug_Fixes.md): placing/editing an order
// never adjusted product_designs stock. This reconciles the design row(s) an
// order's line items point at (matched by productId + selectedColor, since
// order_items stores the design name rather than a design id).
//
// `oldItems` is what the order previously reserved (empty for a brand-new
// order) and `newItems` is what it's being saved as now — passing the order's
// own prior reservation back in means editing an order re-checks against
// "current stock + what this order already had," not just current stock, so
// an unchanged line item doesn't get rejected for exceeding availability.
async function reconcileStock(
  oldItems: StockLineItem[],
  newItems: StockLineItem[]
): Promise<{ errors: string[] } | { updates: { id: number; quantity: number; inStock: boolean }[] }> {
  const productIds = [...new Set([...oldItems, ...newItems].map((i) => i.productId))];
  if (productIds.length === 0) return { updates: [] };

  const designRows = await db
    .select()
    .from(productDesigns)
    .where(inArray(productDesigns.productId, productIds));

  const findDesign = (productId: number, name: string) =>
    designRows.find((d) => d.productId === productId && d.name === name);

  const oldReserved = new Map<number, number>();
  for (const item of oldItems) {
    const design = findDesign(item.productId, item.selectedColor);
    if (design) oldReserved.set(design.id, (oldReserved.get(design.id) ?? 0) + item.quantity);
  }

  const newRequested = new Map<number, number>();
  const errors: string[] = [];
  newItems.forEach((item, i) => {
    const design = findDesign(item.productId, item.selectedColor);
    if (!design) {
      errors.push(`Item ${i + 1}: design "${item.selectedColor}" not found for the selected product`);
      return;
    }
    newRequested.set(design.id, (newRequested.get(design.id) ?? 0) + item.quantity);
  });
  if (errors.length) return { errors };

  const updates: { id: number; quantity: number; inStock: boolean }[] = [];
  for (const designId of new Set([...oldReserved.keys(), ...newRequested.keys()])) {
    const design = designRows.find((d) => d.id === designId)!;
    const available = design.quantity + (oldReserved.get(designId) ?? 0);
    const requested = newRequested.get(designId) ?? 0;
    if (requested > available) {
      errors.push(`Only ${available} left of "${design.name}" (requested ${requested})`);
      continue;
    }
    const finalQuantity = available - requested;
    updates.push({ id: designId, quantity: finalQuantity, inStock: finalQuantity > 0 });
  }
  if (errors.length) return { errors };

  return { updates };
}

async function applyStockUpdates(updates: { id: number; quantity: number; inStock: boolean }[]) {
  if (updates.length === 0) return;
  const queries = updates.map((u) =>
    db.update(productDesigns).set({ quantity: u.quantity, inStock: u.inStock }).where(eq(productDesigns.id, u.id))
  );
  await db.batch([queries[0], ...queries.slice(1)] as never);
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

  const stockResult = await reconcileStock([], items);
  if ("errors" in stockResult) {
    return { errors: { items: stockResult.errors } };
  }

  const [newOrder] = await db.insert(orders).values(orderData).returning({ id: orders.id });

  await db.insert(orderItems).values(
    items.map((item) => ({ ...item, orderId: newOrder.id }))
  );
  await applyStockUpdates(stockResult.updates);

  revalidatePath("/orders");
  revalidatePath("/products");
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

  const existingItems = await db
    .select({
      productId: orderItems.productId,
      selectedColor: orderItems.selectedColor,
      quantity: orderItems.quantity,
    })
    .from(orderItems)
    .where(eq(orderItems.orderId, id));

  const stockResult = await reconcileStock(existingItems, items);
  if ("errors" in stockResult) {
    return { errors: { items: stockResult.errors } };
  }

  await db.update(orders).set(orderData).where(eq(orders.id, id));

  //Replace all items for this order
  await db.delete(orderItems).where(eq(orderItems.orderId, id));
  await db.insert(orderItems).values(
    items.map((item) => ({ ...item, orderId: id }))
  );
  await applyStockUpdates(stockResult.updates);

  revalidatePath("/orders");
  revalidatePath("/products");
  redirect("/orders");
}
