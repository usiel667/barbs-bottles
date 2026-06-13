"use client";

import { SelectProductType } from "@/zod-schema/product";

export type ItemRow = {
  productId: number | "";
  selectedColor: string;
  quantity: number;
};

type Props = {
  row: ItemRow;
  index: number;
  products: SelectProductType[];
  showRemove: boolean;
  onUpdate: (index: number, field: keyof ItemRow, value: string | number) => void;
  onRemove: (index: number) => void;
};

function getColorsForProduct(products: SelectProductType[], productId: number | ""): string[] {
  if (!productId) return [];
  const product = products.find((p) => p.id === Number(productId));
  if (!product?.colors) return [];
  try {
    return JSON.parse(product.colors);
  } catch {
    return [];
  }
}

export function OrderItemRow({ row, index, products, showRemove, onUpdate, onRemove }: Props) {
  const availableColors = getColorsForProduct(products, row.productId);
  const product = products.find((p) => p.id === Number(row.productId));

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
        <input type="hidden" name={`items[${index}][unitPrice]`} value={product?.basePrice ?? "0"} />
        <input type="hidden" name={`items[${index}][discount]`} value="0" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
            Color
          </label>
          <select
            name={`items[${index}][selectedColor]`}
            value={row.selectedColor}
            onChange={(e) => onUpdate(index, "selectedColor", e.target.value)}
            disabled={availableColors.length === 0}
            className="w-full border rounded-md px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white disabled:opacity-50"
          >
            <option value="">
              {availableColors.length === 0 ? "Select a product first" : "Select color"}
            </option>
            {availableColors.map((color) => (
              <option key={color} value={color}>
                {color.charAt(0).toUpperCase() + color.slice(1)}
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
    </div>
  );
}
