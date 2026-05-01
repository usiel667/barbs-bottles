import { db } from "@/db";
import { orders, customers, products } from "@/db/schema";
import { count, sum } from "drizzle-orm";

export async function getDashboardStats() {
  try {
    const [ordersRes, customersRes, productsRes, revenueRes] = await Promise.all([
      db.select({ value: count() }).from(orders),
      db.select({ value: count() }).from(customers),
      db.select({ value: count() }).from(products),
      db.select({ value: sum(orders.totalPrice) }).from(orders),
    ]);

    return {
      totalOrders: ordersRes[0]?.value ?? 0,
      totalCustomers: customersRes[0]?.value ?? 0,
      totalProducts: productsRes[0]?.value ?? 0,
      totalRevenue: revenueRes[0]?.value ?? 0,
    };
  } catch (error) {
    console.error("Failed to fetch dashboard stats:", error);
    throw new Error("Failed to load dashboard data");
  }
}

