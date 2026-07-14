"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronRight } from "lucide-react";

export type Variant = {
  productId: number;
  size: string;
  price: string;
  msrpPrice: string | null;
  inStock: boolean;
  quantity: number;
  active: boolean;
};

export type DesignGroup = {
  design: string;
  series: string;
  variants: Variant[];
};

export function ProductDesignRow({ group }: { group: DesignGroup }) {
  const [expanded, setExpanded] = useState(false);

  const inStockCount = group.variants.filter((v) => v.inStock).length;
  const anyActive = group.variants.some((v) => v.active);

  return (
    <>
      <tr
        className="hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
        onClick={() => setExpanded((v) => !v)}
      >
        <td className="px-4 py-4 text-gray-400">
          {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </td>
        <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{group.design}</td>
        <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">{group.series}</td>
        <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
          {inStockCount} of {group.variants.length} sizes
        </td>
        <td className="px-6 py-4">
          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${anyActive
            ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
            : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
            }`}>
            {anyActive ? "Active" : "Inactive"}
          </span>
        </td>
        <td className="px-6 py-4 text-right" />
      </tr>

      {expanded && (
        <tr>
          <td colSpan={6} className="px-6 pb-4 bg-gray-50 dark:bg-gray-900">
            <table className="min-w-full text-sm mt-2">
              <thead>
                <tr className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase border-b dark:border-gray-700">
                  <th className="pb-2 text-left">Size</th>
                  <th className="pb-2 text-left">Price</th>
                  <th className="pb-2 text-left">In Stock</th>
                  <th className="pb-2 text-left">Status</th>
                  <th className="pb-2 text-right">Edit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {group.variants.map((v) => (
                  <tr key={v.productId}>
                    <td className="py-2 text-gray-900 dark:text-white">{v.size}</td>
                    <td className="py-2 text-gray-700 dark:text-gray-300">
                      ${Number(v.price).toFixed(2)}
                      {v.msrpPrice && (
                        <span className="ml-2 text-xs text-gray-400 line-through">
                          ${Number(v.msrpPrice).toFixed(2)}
                        </span>
                      )}
                    </td>
                    <td className="py-2 text-gray-700 dark:text-gray-300">
                      {v.inStock ? `${v.quantity} in stock` : "Out of stock"}
                    </td>
                    <td className="py-2">
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${v.active
                        ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                        : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
                        }`}>
                        {v.active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="py-2 text-right">
                      <Button asChild size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
                        <Link href={`/products/form?id=${v.productId}`}>Edit</Link>
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </td>
        </tr>
      )}
    </>
  );
}
