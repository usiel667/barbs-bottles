import { db } from "@/db";
import { products, productDesigns, productSeries, bottleSizes } from "@/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { SingleVariantEditor } from "./SingleVariantEditor";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function DesignVariantEditorPage({ params }: Props) {
  const { id } = await params;
  const productDesignId = parseInt(id, 10);
  if (isNaN(productDesignId)) notFound();

  const [row] = await db
    .select({
      productDesignId: productDesigns.id,
      designName: productDesigns.name,
      price: productDesigns.price,
      msrpPrice: productDesigns.msrpPrice,
      quantity: productDesigns.quantity,
      productId: products.id,
      productName: products.name,
      coldRetentionHours: products.coldRetentionHours,
      hotRetentionHours: products.hotRetentionHours,
      warranty: products.warranty,
      hasHandle: products.hasHandle,
      leakProof: products.leakProof,
      active: products.active,
      series: productSeries.name,
      size: bottleSizes.code,
    })
    .from(productDesigns)
    .innerJoin(products, eq(productDesigns.productId, products.id))
    .innerJoin(productSeries, eq(products.seriesId, productSeries.id))
    .innerJoin(bottleSizes, eq(products.sizeId, bottleSizes.id))
    .where(eq(productDesigns.id, productDesignId))
    .limit(1);

  if (!row) notFound();

  const [productNameRows, designNameRows] = await Promise.all([
    db.selectDistinct({ name: products.name }).from(products),
    db.selectDistinct({ name: productDesigns.name }).from(productDesigns),
  ]);

  return (
    <SingleVariantEditor
      variant={row}
      productNames={productNameRows.map((r) => r.name)}
      designNames={designNameRows.map((r) => r.name)}
    />
  );
}
