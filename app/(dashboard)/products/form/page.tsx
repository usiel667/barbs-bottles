import { db } from "@/db";
import { products, productDesigns } from "@/db/schema";
import { eq } from "drizzle-orm";
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

  return <ProductForm product={product} designs={designs} />;
}
