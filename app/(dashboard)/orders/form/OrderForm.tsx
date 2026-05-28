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

// Use schema enum values — NOT the values from ProductConstants.ts (they differ)
const ORDER_STATUSES = [
  { id: "pending", label: "Pending" },
  { id: "design", label: "Design" },
  { id: "production", label: "Production" },
  { id: "quality_check", label: "Quality Check" },
  { id: "shipped", label: "Shipped" },
  { id: "delivered", label: "Delivered" },
  { id: "canceled", label: "Canceled" },
];

type Props = {
  order?: SelectOrderType | null;
  existingItems: SelectOrderItemType[];
  customers: SelectCustomerType[];
  products: SelectProductType[];
};

export function OrderForm({ order, existingItems, customers, products }: Props) {
  const isEditing = Boolean(order);

  // Track selected product so we can derive available colors
  const [selectedProductId, setSelectedProductId] = useState<number | "">(
    existingItems[0]?.productId ?? ""
  );

  const selectedProduct = products.find((p) => p.id === Number(selectedProductId));

  // Parse the product's stored JSON colors string to get color options
  let availableColors: string[] = [];
  if (selectedProduct?.colors) {
    try {
      availableColors = JSON.parse(selectedProduct.colors);
    } catch {
      availableColors = [];
    }
  }

  const action = isEditing
    ? updateOrder.bind(null, order!.id)
    : createOrder;

  const [state, formAction, isPending] = useActionState<FormState, FormData>(
    action,
    null
  );

  // Format estimatedDelivery for the date input (needs "YYYY-MM-DD")
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

        {/* Product */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Product <span className="text-red-500">*</span>
          </label>
          <select
            name="productId"
            value={selectedProductId}
            onChange={(e) => setSelectedProductId(e.target.value ? Number(e.target.value) : "")}
            className="w-full border rounded-md px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          >
            <option value="">Select product</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} — {p.size} ({p.material.replace("_", " ")})
              </option>
            ))}
          </select>
          <FieldError errors={state?.errors?.productId} />
        </div>

        {/* Color — derived from selected product */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Color <span className="text-red-500">*</span>
          </label>
          <select
            name="selectedColor"
            defaultValue={existingItems[0]?.selectedColor ?? ""}
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
          <FieldError errors={state?.errors?.selectedColor} />
        </div>

        {/* Quantity + Total Price */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Quantity <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              name="quantity"
              min="1"
              step="1"
              defaultValue={existingItems[0]?.quantity ?? 1}
              className="w-full border rounded-md px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
            <FieldError errors={state?.errors?.quantity} />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Total Price ($) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              name="totalPrice"
              min="0"
              step="0.01"
              defaultValue={order?.totalPrice ?? ""}
              className="w-full border rounded-md px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
            <FieldError errors={state?.errors?.totalPrice} />
          </div>
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
