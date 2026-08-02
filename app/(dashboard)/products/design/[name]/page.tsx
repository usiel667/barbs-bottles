import { db } from "@/db";
import { products, productDesigns, productSeries, bottleSizes } from "@/db/schema";
import { eq, asc } from "drizzle-orm";
import { notFound } from "next/navigation";
import { BulkDesignEditor } from "./BulkDesignEditor";

type Props = {
  params: Promise<{ name: string }>;
};

export default async function BulkDesignEditorPage({ params }: Props) {
  const { name } = await params;
  const designName = decodeURIComponent(name);

  const variants = await db
    .select({
      productDesignId: productDesigns.id,
      productId: products.id,
      series: productSeries.name,
      size: bottleSizes.code,
      price: productDesigns.price,
      msrpPrice: productDesigns.msrpPrice,
      quantity: productDesigns.quantity,
      active: products.active,
    })
    .from(productDesigns)
    .innerJoin(products, eq(productDesigns.productId, products.id))
    .innerJoin(productSeries, eq(products.seriesId, productSeries.id))
    .innerJoin(bottleSizes, eq(products.sizeId, bottleSizes.id))
    .where(eq(productDesigns.name, designName))
    .orderBy(asc(productSeries.name), asc(bottleSizes.id));

  if (!variants.length) notFound();

  return <BulkDesignEditor designName={designName} variants={variants} />;
}
