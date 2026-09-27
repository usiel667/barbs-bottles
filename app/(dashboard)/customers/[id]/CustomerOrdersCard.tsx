import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { STATUS_CLASSES, STATUS_LABELS } from "@/constants/orderStatus";
import type { CustomerOrder } from "@/lib/queries/customers";

const formatDate = (date: Date) =>
  new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

const formatDelivery = (date: Date | null) => (date ? formatDate(date) : "—");
const formatTotal = (total: string | number) => `$${Number(total).toFixed(2)}`;
const pluralizeItems = (count: number) => `${count} item${count === 1 ? "" : "s"}`;

const TABLE_HEADERS = ["Order #", "Placed", "Status", "Items", "Total", "Est. Delivery"];

function OrderStatusBadge({ status, compact = false }: { status: string; compact?: boolean }) {
  const padding = compact ? "px-2" : "px-2.5";
  return (
    <span className={`inline-flex items-center rounded-full ${padding} py-0.5 text-xs font-medium ${STATUS_CLASSES[status] ?? ""}`}>
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}

function OrderTableRow({ order }: { order: CustomerOrder }) {
  return (
    <tr className="relative hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
      <td className="px-6 py-4 font-medium">
        <Link href={`/orders/form?id=${order.id}`} className="text-blue-600 hover:underline after:absolute after:inset-0">
          #{order.id}
        </Link>
      </td>
      <td className="px-6 py-4 text-gray-500 dark:text-gray-400">{formatDate(order.createdAt)}</td>
      <td className="px-6 py-4">
        <OrderStatusBadge status={order.status} />
      </td>
      <td className="px-6 py-4 text-gray-700 dark:text-gray-300">{order.itemCount}</td>
      <td className="px-6 py-4 text-gray-700 dark:text-gray-300">{formatTotal(order.totalPrice)}</td>
      <td className="px-6 py-4 text-gray-500 dark:text-gray-400">{formatDelivery(order.estimatedDelivery)}</td>
    </tr>
  );
}

function OrdersTable({ orders }: { orders: CustomerOrder[] }) {
  return (
    <div className="hidden md:block overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
          <tr>
            {TABLE_HEADERS.map((h) => (
              <th
                key={h}
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
          {orders.map((order) => (
            <OrderTableRow key={order.id} order={order} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function OrderMobileCard({ order }: { order: CustomerOrder }) {
  return (
    <Link
      href={`/orders/form?id=${order.id}`}
      className="block p-4 space-y-2 hover:bg-gray-50 dark:hover:bg-gray-700/50"
    >
      <div className="flex items-center justify-between">
        <span className="font-medium text-blue-600">#{order.id}</span>
        <OrderStatusBadge status={order.status} compact />
      </div>
      <div className="text-sm text-gray-600 dark:text-gray-300 flex flex-wrap gap-x-4 gap-y-1">
        <span>Placed {formatDate(order.createdAt)}</span>
        <span>{pluralizeItems(order.itemCount)}</span>
        <span>{formatTotal(order.totalPrice)}</span>
        <span>Est. delivery {formatDelivery(order.estimatedDelivery)}</span>
      </div>
    </Link>
  );
}

function OrdersMobileList({ orders }: { orders: CustomerOrder[] }) {
  return (
    <div className="md:hidden divide-y divide-gray-200 dark:divide-gray-700">
      {orders.map((order) => (
        <OrderMobileCard key={order.id} order={order} />
      ))}
    </div>
  );
}

function OrdersEmptyState() {
  return (
    <div className="p-8 text-center space-y-4">
      <p className="text-gray-600 dark:text-gray-400">No orders yet for this customer.</p>
      <Button asChild className="bg-blue-600 hover:bg-blue-700 text-white">
        <Link href="/orders/form">
          <Plus className="h-4 w-4" />
          Add Order
        </Link>
      </Button>
    </div>
  );
}

export function CustomerOrdersCard({ orders }: { orders: CustomerOrder[] }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Orders ({orders.length})
        </h2>
      </div>
      {orders.length === 0 ? (
        <OrdersEmptyState />
      ) : (
        <>
          <OrdersTable orders={orders} />
          <OrdersMobileList orders={orders} />
        </>
      )}
    </div>
  );
}
