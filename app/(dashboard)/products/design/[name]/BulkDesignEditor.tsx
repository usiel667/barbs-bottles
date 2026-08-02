"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { updateDesignVariants, type VariantUpdate } from "@/app/(dashboard)/products/actions";

type Variant = {
  productDesignId: number;
  productId: number;
  series: string;
  size: string;
  price: string;
  msrpPrice: string | null;
  quantity: number;
  active: boolean;
};

type Props = {
  designName: string;
  variants: Variant[];
};

type RowState = {
  productDesignId: number;
  productId: number;
  series: string;
  size: string;
  price: string;
  msrpPrice: string;
  quantity: string;
  active: boolean;
};

export function BulkDesignEditor({ designName, variants }: Props) {
  const router = useRouter();
  const [rows, setRows] = useState<RowState[]>(() =>
    variants.map((v) => ({
      productDesignId: v.productDesignId,
      productId: v.productId,
      series: v.series,
      size: v.size,
      price: v.price,
      msrpPrice: v.msrpPrice ?? "",
      quantity: String(v.quantity),
      active: v.active,
    }))
  );
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function updateRow(index: number, field: "price" | "msrpPrice" | "quantity", value: string): void;
  function updateRow(index: number, field: "active", value: boolean): void;
  function updateRow(index: number, field: keyof RowState, value: string | boolean) {
    setRows((rs) => rs.map((r, i) => (i === index ? { ...r, [field]: value } : r)));
  }

  function handleSave() {
    setError(null);
    const updates: VariantUpdate[] = rows.map((r) => ({
      productDesignId: r.productDesignId,
      productId: r.productId,
      price: r.price,
      msrpPrice: r.msrpPrice || undefined,
      quantity: Number(r.quantity) || 0,
      active: r.active,
    }));
    startTransition(async () => {
      const result = await updateDesignVariants(updates);
      if ("error" in result) {
        setError(result.error);
        return;
      }
      router.push("/products");
    });
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Edit Design: {designName}
        </h1>
        <Button asChild variant="outline" className="dark:text-white bg-blue-600 hover:bg-blue-700">
          <Link href="/products">Back to Products</Link>
        </Button>
      </div>

      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border space-y-4">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Editing Price / MSRP / Quantity / Active for every series and size this design appears in.
          Adding or removing a variant isn&apos;t available here — use the single-variant editor for that.
        </p>

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase border-b dark:border-gray-700">
                <th className="py-2 text-left">Series</th>
                <th className="py-2 text-left">Size</th>
                <th className="py-2 text-left">Price</th>
                <th className="py-2 text-left">MSRP</th>
                <th className="py-2 text-left">Quantity</th>
                <th className="py-2 text-left">Active</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {rows.map((row, i) => (
                <tr key={row.productDesignId}>
                  <td className="py-2 pr-2 text-gray-900 dark:text-white">{row.series}</td>
                  <td className="py-2 pr-2 text-gray-900 dark:text-white">{row.size}</td>
                  <td className="py-2 pr-2">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={row.price}
                      onChange={(e) => updateRow(i, "price", e.target.value)}
                      className="w-24 border rounded-md px-2 py-1 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                  </td>
                  <td className="py-2 pr-2">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={row.msrpPrice}
                      onChange={(e) => updateRow(i, "msrpPrice", e.target.value)}
                      className="w-24 border rounded-md px-2 py-1 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                  </td>
                  <td className="py-2 pr-2">
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={row.quantity}
                      onChange={(e) => updateRow(i, "quantity", e.target.value)}
                      className="w-20 border rounded-md px-2 py-1 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                  </td>
                  <td className="py-2">
                    <input
                      type="checkbox"
                      checked={row.active}
                      onChange={(e) => updateRow(i, "active", e.target.checked)}
                      className="h-4 w-4"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex gap-3 pt-2">
          <Button type="button" disabled={isPending} onClick={handleSave} className="bg-blue-600 hover:bg-blue-700 text-white">
            {isPending ? "Saving..." : "Save All"}
          </Button>
          <Button asChild variant="outline" className="dark:text-white">
            <Link href="/products">Cancel</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
