import { db } from "@/db";
import { products, productDesigns } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Package } from "lucide-react";
import { TableHeading } from "@/components/ui/table-heading";
import { ProductDesignRow, type DesignGroup } from "./ProductDesignRow";

export default async function ProductsPage() {
  const rows = await db
    .select({
      productId: products.id,
      series: products.series,
      size: products.size,
      active: products.active,
      designName: productDesigns.name,
      price: productDesigns.price,
      msrpPrice: productDesigns.msrpPrice,
      inStock: productDesigns.inStock,
      quantity: productDesigns.quantity,
    })
    .from(products)
    .innerJoin(productDesigns, eq(productDesigns.productId, products.id))
    .orderBy(desc(products.createdAt));

  const groups = new Map<string, DesignGroup>();
  for (const row of rows) {
    const key = `${row.series}::${row.designName}`;
    if (!groups.has(key)) {
      groups.set(key, { design: row.designName, series: row.series, variants: [] });
    }
    groups.get(key)!.variants.push({
      productId: row.productId,
      size: row.size,
      price: row.price,
      msrpPrice: row.msrpPrice,
      inStock: row.inStock,
      quantity: row.quantity,
      active: row.active,
    });
  }
  const designGroups = Array.from(groups.values());
  const seriesCount = new Set(designGroups.map((g) => g.series)).size;
  const totalInStock = designGroups.reduce(
    (sum, g) => sum + g.variants.filter((v) => v.inStock).length,
    0
  );

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Products</h1>
          <p className="text-gray-600 dark:text-gray-300">
            {designGroups.length} design{designGroups.length !== 1 ? "s" : ""} · {seriesCount} series · {totalInStock} in stock
          </p>
        </div>
        <Button asChild className="bg-blue-600 hover:bg-blue-700 text-white">
          <Link href="/products/form">+ Add Product</Link>
        </Button>
      </div>

      {/* Empty state */}
      {designGroups.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-lg shadow-sm border">
          <Package className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No products yet</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">Add your first product to get started.</p>
          <Button asChild className="bg-blue-600 hover:bg-blue-700 text-white">
            <Link href="/products/form">+ Add Product</Link>
          </Button>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border overflow-hidden">

          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="px-4 py-3 w-8" />
                  <TableHeading label="Design" />
                  <TableHeading label="Series" />
                  <TableHeading label="In Stock" />
                  <TableHeading label="Status" />
                  <TableHeading label="Action" align="right" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {designGroups.map((group) => (
                  <ProductDesignRow key={`${group.series}::${group.design}`} group={group} />
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile card list */}
          <div className="md:hidden divide-y divide-gray-200 dark:divide-gray-700">
            {designGroups.map((group) => {
              const inStockCount = group.variants.filter((v) => v.inStock).length;
              const anyActive = group.variants.some((v) => v.active);
              return (
                <div key={`${group.series}::${group.design}`} className="p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{group.design}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{group.series}</p>
                    </div>
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${anyActive
                      ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                      : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
                      }`}>
                      {anyActive ? "Active" : "Inactive"}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    {inStockCount} of {group.variants.length} sizes in stock
                  </p>
                </div>
              );
            })}
          </div>

        </div>
      )}
    </div>
  );
}
