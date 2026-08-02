"use client";

import { SelectProductType } from "@/zod-schema/product";
import { SelectProductDesignType } from "@/zod-schema/productDesign";

export type ItemRow = {
  productId: number | "";
  selectedColor: string;
  quantity: number;
  discount: string;
};

export type ProductWithDesigns = SelectProductType & {
  designs: SelectProductDesignType[];
  size: string;
};

type Props = {
  row: ItemRow;
  index: number;
  products: ProductWithDesigns[];
  showRemove: boolean;
  onUpdate: (index: number, field: keyof ItemRow, value: string | number) => void;
  onRemove: (index: number) => void;
};

function getDesignsForProduct(
  products: ProductWithDesigns[],
  productId: number | "",
  selectedColor: string
): SelectProductDesignType[] {
  if (!productId) return [];
  const product = products.find((p) => p.id === Number(productId));
  if (!product) return [];
  const inStockDesigns = product.designs.filter((d) => d.inStock);
  // Keep the currently selected design in the list even if it's since gone
  // out of stock, so editing an existing order doesn't blank the Design
  // field or silently zero out unitPrice (Bug 12).
  if (selectedColor && !inStockDesigns.some((d) => d.name === selectedColor)) {
    const current = product.designs.find((d) => d.name === selectedColor);
    if (current) return [current, ...inStockDesigns];
  }
  return inStockDesigns;
}

export function OrderItemRow({ row, index, products, showRemove, onUpdate, onRemove }: Props) {
  const availableDesigns = getDesignsForProduct(products, row.productId, row.selectedColor);
  const selectedDesign = availableDesigns.find((d) => d.name === row.selectedColor);

  return (
    <div className="border dark:border-gray-600 rounded-lg p-4 space-y-3 relative">
      {showRemove && (
        <button
          type="button"
          onClick={() => onRemove(index)}
          className="absolute top-3 right-3 text-xs text-red-500 hover:text-red-700"
        >
          Remove
        </button>
      )}

      <div>
        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
          Product
        </label>
        <select
          value={row.productId}
          onChange={(e) =>
            onUpdate(index, "productId", e.target.value ? Number(e.target.value) : "")
          }
          className="w-full border rounded-md px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
        >
          <option value="">Select product</option>
          {products.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} — {p.size} ({p.material.replace("_", " ")})
            </option>
          ))}
        </select>
        <input type="hidden" name={`items[${index}][productId]`} value={String(row.productId || "")} />
        <input type="hidden" name={`items[${index}][unitPrice]`} value={selectedDesign?.price ?? "0"} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
            Design
          </label>
          <select
            name={`items[${index}][selectedColor]`}
            value={row.selectedColor}
            onChange={(e) => onUpdate(index, "selectedColor", e.target.value)}
            disabled={availableDesigns.length === 0}
            className="w-full border rounded-md px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white disabled:opacity-50"
          >
            <option value="">
              {availableDesigns.length === 0 ? "Select a product first" : "Select design"}
            </option>
            {availableDesigns.map((d) => (
              <option key={d.name} value={d.name}>
                {d.name}{!d.inStock ? " (out of stock)" : d.quantity <= 5 ? ` (${d.quantity} left)` : ""}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
            Quantity
          </label>
          <input
            type="number"
            name={`items[${index}][quantity]`}
            min="1"
            step="1"
            value={row.quantity}
            onChange={(e) => onUpdate(index, "quantity", Number(e.target.value) || 1)}
            className="w-full border rounded-md px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
          Discount %
        </label>
        <input
          type="number"
          name={`items[${index}][discount]`}
          min="0"
          max="100"
          step="0.01"
          value={row.discount}
          onChange={(e) => onUpdate(index, "discount", e.target.value)}
          className="w-full border rounded-md px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
        />
      </div>
    </div>
  );
}
