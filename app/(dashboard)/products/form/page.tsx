import { db } from "@/db";
import { products, productDesigns, productSeries, bottleSizes } from "@/db/schema";
import { eq, asc } from "drizzle-orm";
import { notFound } from "next/navigation";
import { ProductForm } from "./ProductForm";

type Props = {
  searchParams: Promise<{ id?: string }>;
};

export default async function ProductFormPage({ searchParams }: Props) {
  const { id } = await searchParams;
  const productId = id ? parseInt(id, 10) : null;

  //guard against non-numeric ?id values
  if (productId !== null && isNaN(productId)) notFound();

  const [allSeries, allSizes, productNameRows] = await Promise.all([
    db.select().from(productSeries).orderBy(asc(productSeries.name)),
    db.select().from(bottleSizes).orderBy(asc(bottleSizes.id)),
    db.selectDistinct({ name: products.name }).from(products).orderBy(asc(products.name)),
  ]);
  const productNames = productNameRows.map((r) => r.name);

  let product = null;
  let designs = undefined;
  if (productId !== null) {
    const result = await db
      .select()
      .from(products)
      .where(eq(products.id, productId))
      .limit(1);

    if (!result.length) notFound();
    product = result[0];
    designs = await db
      .select()
      .from(productDesigns)
      .where(eq(productDesigns.productId, productId));
  }

  return (
    <ProductForm
      product={product}
      designs={designs}
      allSeries={allSeries}
      allSizes={allSizes}
      productNames={productNames}
    />
  );
}
