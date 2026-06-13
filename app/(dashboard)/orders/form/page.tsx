import { db } from "@/db";
import { orders, customers, products, orderItems } from "@/db/schema";
import { eq, asc } from "drizzle-orm";
import { notFound } from "next/navigation";
import { OrderForm, ExistingItem } from "./OrderForm";

type Props = {
  searchParams: Promise<{ id?: string }>;

};

export default async function OrderFormPage({ searchParams }: Props) {
  const { id } = await searchParams;
  const orderId = id ? parseInt(id, 10) : null;

  if (orderId !== null && isNaN(orderId)) notFound();

  // Fetch supoorting data from the dropdowns
  const [allCustomers, allProducts] = await Promise.all([
    db.select().from(customers).orderBy(asc(customers.lastName)),
    db.select().from(products)
      .where(eq(products.active, true))
      .orderBy(asc(products.name)),
  ]);

  let order = null;
  let existingItems: ExistingItem[] = [];

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


