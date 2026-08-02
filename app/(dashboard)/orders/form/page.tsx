import { db } from "@/db";
import { orders, customers, products, orderItems, productDesigns, bottleSizes } from "@/db/schema";
import { eq, asc, inArray, getTableColumns } from "drizzle-orm";
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
  const [allCustomers, activeProducts] = await Promise.all([
    db.select().from(customers).orderBy(asc(customers.lastName)),
    db.select({ ...getTableColumns(products), size: bottleSizes.code })
      .from(products)
      .innerJoin(bottleSizes, eq(products.sizeId, bottleSizes.id))
      .where(eq(products.active, true))
      .orderBy(asc(products.name)),
  ]);

  const allDesigns = activeProducts.length > 0
    ? await db.select().from(productDesigns).where(
        inArray(productDesigns.productId, activeProducts.map((p) => p.id))
      )
    : [];
  const designsByProduct = new Map<number, typeof allDesigns>();
  for (const d of allDesigns) {
    const list = designsByProduct.get(d.productId) ?? [];
    list.push(d);
    designsByProduct.set(d.productId, list);
  }
  const allProducts = activeProducts.map((p) => ({
    ...p,
    designs: designsByProduct.get(p.id) ?? [],
  }));

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


