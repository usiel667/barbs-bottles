# Gem: Dashboard Page Fixes

This document outlines the errors found in `app/(dashboard)/home/page.tsx` and provides the necessary corrections.

## Identified Issues

1.  **Missing `async` Keyword**: The component uses `await` but was not declared as an `async` function.
2.  **Syntax Error in `db.select`**: The first select statement had an opening bracket `[` instead of a brace `{`.
3.  **Schema Mismatch**: You were attempting to sum `orders.amount`, but the actual column name in your schema is `orders.totalPrice`.
4.  **Unused Data**: The fetched counts for Customers and Products were being ignored in the UI, which was still displaying hardcoded `0` values.

## Corrected Implementation

```tsx
import { Package, Users, ShoppingCart, TrendingUp } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { db } from "@/db";
import { orders, customers, products } from "@/db/schema";
import { count, sum } from "drizzle-orm";

export default async function HomePage() {
  const [
    [{ totalOrders }], 
    [{ totalCustomers }], 
    [{ totalProducts }], 
    [{ totalRevenue }]
  ] = await Promise.all([
    db.select({ totalOrders: count() }).from(orders),
    db.select({ totalCustomers: count() }).from(customers),
    db.select({ totalProducts: count() }).from(products),
    db.select({ totalRevenue: sum(orders.totalPrice) }).from(orders),
  ]);

  const formattedRevenue = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(Number(totalRevenue ?? 0));

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Manage your custom water bottle business
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border">
          <div className="flex items-center gap-4">
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <ShoppingCart className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Orders</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalOrders}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border">
          <div className="flex items-center gap-4">
            <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
              <Users className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Customers</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalCustomers}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border">
          <div className="flex items-center gap-4">
            <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
              <Package className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Products</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalProducts}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border">
          <div className="flex items-center gap-4">
            <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded-lg">
              <TrendingUp className="h-6 w-6 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Revenue</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{formattedRevenue}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Quick Actions
        </h2>
        <div className="grid gap-4 md:grid-cols-3">
          <Button asChild variant="outline">
            <Link href="/customers/form">Add New Customer</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/products/form">Create Product</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/orders/form">New Order</Link>
          </Button>
        </div>
      </div>

      {/* Recent Activity Placeholder */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Recent Activity
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          No recent activity. Start by adding customers and products!
        </p>
      </div>
    </div>
  );
}
```
