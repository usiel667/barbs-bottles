import { db } from "@/db";
import { products } from "@/db/schema";
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
  if (productId !== null) {
    const result = await db
      .select()
      .from(products)
      .where(eq(products.id, productId))
      .limit(1);

    if (!result.length) notFound();
    product = result[0];
  }

  return <ProductForm product={product} />;
}
