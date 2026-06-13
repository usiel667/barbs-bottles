import { db } from "@/db";
import { orders, customers, products, orderItems } from "@/db/schema";
import { desc, eq, inArray } from "drizzle-orm";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ShoppingCart } from "lucide-react";
import { OrderRow } from "./OrderRow";
import { TableHeading } from "@/components/ui/table-heading";

export default async function OrdersPage() {
  const orderRows = await db
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

  const allItems = orderRows.length > 0
    ? await db
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
        .innerJoin(products, eq(orderItems.productId, products.id))
        .where(inArray(orderItems.orderId, orderRows.map((o) => o.id)))
    : [];

  const itemsByOrder = new Map<number, typeof allItems>();
  for (const item of allItems) {
    const list = itemsByOrder.get(item.orderId) ?? [];
    list.push(item);
    itemsByOrder.set(item.orderId, list);
  }

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Orders</h1>
          <p className="text-gray-600 dark:text-gray-300">
            {orderRows.length} order{orderRows.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Button asChild className="bg-blue-600 hover:bg-blue-700 text-white">
          <Link href="/orders/form">+ New Order</Link>
        </Button>
      </div>

      {/* Empty state */}
      {orderRows.length === 0 ? (
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

          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="px-4 py-3 w-8" />
                  <TableHeading label="#" />
                  <TableHeading label="Customer" />
                  <TableHeading label="Items" />
                  <TableHeading label="Status" />
                  <TableHeading label="Total" />
                  <TableHeading label="Date" />
                  <TableHeading label="Action" align="right" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {orderRows.map((order) => (
                  <OrderRow
                    key={order.id}
                    order={order}
                    items={itemsByOrder.get(order.id) ?? []}
                  />
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile card list */}
          <div className="md:hidden divide-y divide-gray-200 dark:divide-gray-700">
            {orderRows.map((order) => {
              const items = itemsByOrder.get(order.id) ?? [];
              return (
                <div key={order.id} className="p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {order.customerFirstName} {order.customerLastName}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {items.length} item{items.length !== 1 ? "s" : ""}
                      </p>
                    </div>
                    <Button asChild size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
                      <Link href={`/orders/form?id=${order.id}`}>Edit</Link>
                    </Button>
                  </div>
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      ${Number(order.totalPrice).toFixed(2)}
                    </span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {new Date(order.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </span>
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
