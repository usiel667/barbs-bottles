"use server";

import { db } from "@/db";
import { customers, products, productDesigns, productSeries, bottleSizes, orders } from "@/db/schema";
import { eq, ilike, or, sql } from "drizzle-orm";

const MIN_QUERY_LENGTH = 2;
const FETCH_LIMIT = 6;
const RESULT_CAP = 5;

export type CustomerResult = {
  id: number;
  name: string;
  email: string | null;
  href: string;
};

export type ProductResult = {
  id: number;
  productName: string;
  designName: string;
  series: string;
  size: string;
  href: string;
};

export type OrderResult = {
  id: number;
  status: string;
  customerName: string;
  href: string;
};

type ResultGroup<T> = {
  results: T[];
  hasMore: boolean;
};

export type GroupedSearchResults = {
  customers: ResultGroup<CustomerResult>;
  products: ResultGroup<ProductResult>;
  orders: ResultGroup<OrderResult>;
};

const emptyResults: GroupedSearchResults = {
  customers: { results: [], hasMore: false },
  products: { results: [], hasMore: false },
  orders: { results: [], hasMore: false },
};

function capResults<T>(rows: T[]): ResultGroup<T> {
  return {
    results: rows.slice(0, RESULT_CAP),
    hasMore: rows.length > RESULT_CAP,
  };
}

async function searchCustomers(pattern: string) {
  const rows = await db
    .select({
      id: customers.id,
      firstName: customers.firstName,
      lastName: customers.lastName,
      email: customers.email,
    })
    .from(customers)
    .where(
      or(
        ilike(customers.firstName, pattern),
        ilike(customers.lastName, pattern),
        ilike(customers.email, pattern),
        ilike(customers.phone, pattern),
        ilike(customers.address1, pattern),
        ilike(customers.address2, pattern),
        ilike(customers.city, pattern),
        ilike(customers.notes, pattern)
      )
    )
    .limit(FETCH_LIMIT);

  return rows.map((row): CustomerResult => ({
    id: row.id,
    name: `${row.firstName} ${row.lastName}`,
    email: row.email,
    href: `/customers/form?id=${row.id}`,
  }));
}

async function searchProducts(pattern: string) {
  const rows = await db
    .select({
      designId: productDesigns.id,
      productName: products.name,
      designName: productDesigns.name,
      series: productSeries.name,
      sizeCode: bottleSizes.code,
      sizeDescription: bottleSizes.description,
      description: products.description,
    })
    .from(productDesigns)
    .innerJoin(products, eq(productDesigns.productId, products.id))
    .innerJoin(productSeries, eq(products.seriesId, productSeries.id))
    .innerJoin(bottleSizes, eq(products.sizeId, bottleSizes.id))
    .where(
      or(
        ilike(products.name, pattern),
        ilike(productDesigns.name, pattern),
        ilike(productSeries.name, pattern),
        ilike(bottleSizes.code, pattern),
        ilike(bottleSizes.description, pattern),
        ilike(products.description, pattern)
      )
    )
    .limit(FETCH_LIMIT);

  return rows.map((row): ProductResult => ({
    id: row.designId,
    productName: row.productName,
    designName: row.designName,
    series: row.series,
    size: row.sizeCode,
    href: `/products/design-variant/${row.designId}`,
  }));
}

async function searchOrders(pattern: string, exactId: number | null) {
  const idMatch = exactId !== null ? eq(orders.id, exactId) : undefined;

  const rows = await db
    .select({
      id: orders.id,
      status: orders.status,
      firstName: customers.firstName,
      lastName: customers.lastName,
    })
    .from(orders)
    .innerJoin(customers, eq(orders.customerId, customers.id))
    .where(
      or(
        sql`${orders.status}::text ILIKE ${pattern}`,
        ilike(orders.shippingAddress1, pattern),
        ilike(orders.shippingAddress2, pattern),
        ilike(orders.shippingCity, pattern),
        ilike(orders.designNotes, pattern),
        ilike(customers.firstName, pattern),
        ilike(customers.lastName, pattern),
        idMatch
      )
    )
    .limit(FETCH_LIMIT);

  return rows.map((row): OrderResult => ({
    id: row.id,
    status: row.status,
    customerName: `${row.firstName} ${row.lastName}`,
    href: `/orders/form?id=${row.id}`,
  }));
}

export async function searchAll(query: string): Promise<GroupedSearchResults> {
  const trimmed = query.trim();
  if (trimmed.length < MIN_QUERY_LENGTH) return emptyResults;

  const pattern = `%${trimmed}%`;
  const exactId = /^\d+$/.test(trimmed) ? parseInt(trimmed, 10) : null;

  const [customerRows, productRows, orderRows] = await Promise.all([
    searchCustomers(pattern),
    searchProducts(pattern),
    searchOrders(pattern, exactId),
  ]);

  return {
    customers: capResults(customerRows),
    products: capResults(productRows),
    orders: capResults(orderRows),
  };
}
