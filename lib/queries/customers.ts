import { db } from "@/db";
import { customers, orders, orderItems } from "@/db/schema";
import { count, desc, eq } from "drizzle-orm";

export async function getCustomerById(id: number) {
  const [customer] = await db
    .select()
    .from(customers)
    .where(eq(customers.id, id))
    .limit(1);
  return customer ?? null;
}

export type CustomerOrder = Awaited<ReturnType<typeof getCustomerOrders>>[number];

export async function getCustomerOrders(customerId: number) {
  return db
    .select({
      id: orders.id,
      status: orders.status,
      totalPrice: orders.totalPrice,
      estimatedDelivery: orders.estimatedDelivery,
      createdAt: orders.createdAt,
      itemCount: count(orderItems.id),
    })
    .from(orders)
    .leftJoin(orderItems, eq(orderItems.orderId, orders.id))
    .where(eq(orders.customerId, customerId))
    .groupBy(orders.id)
    .orderBy(desc(orders.createdAt));
}
