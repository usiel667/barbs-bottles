"use client";

import { useState } from "react";
import { useActionState } from "react";
import { createOrder, updateOrder } from "@/app/(dashboard)/orders/actions";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { SelectOrderType, SelectOrderItemType } from "@/zod-schema/order";
import { SelectCustomerType } from "@/zod-schema/customer";
import { SelectProductType } from "@/zod-schema/product";

type FormState = {
  errors?: Record<string, string[]>;
} | null;

function FieldError({ errors }: { errors?: string[] }) {
  if (!errors?.length) return null;
  return <p className="text-sm text-red-600 mt-1">{errors[0]}</p>;
}

const ORDER_STATUSES = [
  { id: "pending", label: "Pending" },
  { id: "design", label: "Design" },
  { id: "production", label: "Production" },
  { id: "quality_check", label: "Quality Check" },
  { id: "shipped", label: "Shipped" },
  { id: "delivered", label: "Delivered" },
  { id: "canceled", label: "Canceled" },
];

type ItemRow = {
  productId: number | "";
  selectedColor: string;
  quantity: number;
};

type Props = {
  order?: SelectOrderType | null;
  existingItems: SelectOrderItemType[];
  customers: SelectCustomerType[];
  products: SelectProductType[];
};

export function OrderForm({ order, existingItems, customers, products }: Props) {
  const isEditing = Boolean(order);

  const [itemRows, setItemRows] = useState<ItemRow[]>(
    existingItems.length > 0
      ? existingItems.map((item) => ({
          productId: item.productId,
          selectedColor: item.selectedColor,
          quantity: item.quantity,
        }))
      : [{ productId: "", selectedColor: "", quantity: 1 }]
  );

  function updateItem(index: number, field: keyof ItemRow, value: string | number) {
    setItemRows((rows) =>
      rows.map((row, i) =>
        i !== index
          ? row
          : {
              ...row,
              [field]: value,
              ...(field === "productId" ? { selectedColor: "" } : {}),
            }
      )
    );
  }

  function addItem() {
    setItemRows((rows) => [...rows, { productId: "", selectedColor: "", quantity: 1 }]);
  }

  function removeItem(index: number) {
    setItemRows((rows) => rows.filter((_, i) => i !== index));
  }

  function getColorsForProduct(productId: number | ""): string[] {
    if (!productId) return [];
    const product = products.find((p) => p.id === Number(productId));
    if (!product?.colors) return [];
    try {
      return JSON.parse(product.colors);
    } catch {
      return [];
    }
  }

  const action = isEditing ? updateOrder.bind(null, order!.id) : createOrder;
  const [state, formAction, isPending] = useActionState<FormState, FormData>(action, null);

  const deliveryDefault = order?.estimatedDelivery
    ? new Date(order.estimatedDelivery).toISOString().split("T")[0]
    : "";

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {isEditing ? "Edit Order" : "New Order"}
        </h1>
        <Button asChild variant="outline" className="dark:text-white">
          <Link href="/orders">Cancel</Link>
        </Button>
      </div>

      <form action={formAction} className="space-y-6 bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border">

        {/* Customer */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Customer <span className="text-red-500">*</span>
          </label>
          <select
            name="customerId"
            defaultValue={order?.customerId ?? ""}
            className="w-full border rounded-md px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          >
            <option value="">Select customer</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.firstName} {c.lastName}
              </option>
            ))}
          </select>
          <FieldError errors={state?.errors?.customerId} />
        </div>

        {/* Items */}
        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Items <span className="text-red-500">*</span>
          </label>

          <input type="hidden" name="itemCount" value={itemRows.length} />

          {itemRows.map((row, i) => {
            const availableColors = getColorsForProduct(row.productId);
            const product = products.find((p) => p.id === Number(row.productId));

            return (
              <div key={i} className="border dark:border-gray-600 rounded-lg p-4 space-y-3 relative">
                {itemRows.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeItem(i)}
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
                      updateItem(i, "productId", e.target.value ? Number(e.target.value) : "")
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
                  <input type="hidden" name={`items[${i}][productId]`} value={String(row.productId || "")} />
                  <input type="hidden" name={`items[${i}][unitPrice]`} value={product?.basePrice ?? "0"} />
                  <input type="hidden" name={`items[${i}][discount]`} value="0" />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                      Color
                    </label>
                    <select
                      name={`items[${i}][selectedColor]`}
                      value={row.selectedColor}
                      onChange={(e) => updateItem(i, "selectedColor", e.target.value)}
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
                      name={`items[${i}][quantity]`}
                      min="1"
                      step="1"
                      value={row.quantity}
                      onChange={(e) => updateItem(i, "quantity", Number(e.target.value) || 1)}
                      className="w-full border rounded-md px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                  </div>
                </div>
              </div>
            );
          })}

          <Button
            type="button"
            variant="outline"
            onClick={addItem}
            className="w-full dark:text-white"
          >
            + Add Item
          </Button>

          <FieldError errors={state?.errors?.items} />
        </div>

        {/* Status */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Status
          </label>
          <select
            name="status"
            defaultValue={order?.status ?? "pending"}
            className="w-full border rounded-md px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          >
            {ORDER_STATUSES.map((s) => (
              <option key={s.id} value={s.id}>{s.label}</option>
            ))}
          </select>
          <FieldError errors={state?.errors?.status} />
        </div>

        {/* Estimated Delivery */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Estimated Delivery <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <input
            type="date"
            name="estimatedDelivery"
            defaultValue={deliveryDefault}
            className="w-full border rounded-md px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          />
        </div>

        {/* Assigned To */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Assigned To <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <input
            type="text"
            name="assignedTo"
            defaultValue={order?.assignedTo ?? ""}
            placeholder="unassigned"
            className="w-full border rounded-md px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          />
        </div>

        {/* Custom Design Text */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Custom Design Text <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <textarea
            name="customDesignText"
            rows={2}
            defaultValue={order?.customDesignText ?? ""}
            placeholder="e.g. Company name, slogan..."
            className="w-full border rounded-md px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          />
        </div>

        {/* Design Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Design Notes <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <textarea
            name="designNotes"
            rows={2}
            defaultValue={order?.designNotes ?? ""}
            placeholder="Internal notes for the design team..."
            className="w-full border rounded-md px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          />
        </div>

        {/* Custom Logo URL */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Custom Logo URL <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <input
            type="url"
            name="customLogoUrl"
            defaultValue={order?.customLogoUrl ?? ""}
            className="w-full border rounded-md px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          />
        </div>

        {/* Submit */}
        <div className="flex gap-3 pt-2">
          <Button type="submit" disabled={isPending} className="bg-blue-600 hover:bg-blue-700 text-white">
            {isPending ? "Saving..." : isEditing ? "Update Order" : "Create Order"}
          </Button>
          <Button asChild variant="outline" className="dark:text-white">
            <Link href="/orders">Cancel</Link>
          </Button>
        </div>

      </form>
    </div>
  );
}
