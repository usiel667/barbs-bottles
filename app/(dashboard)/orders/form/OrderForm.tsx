"use client";

import { useState } from "react";
import { useActionState } from "react";
import { createOrder, updateOrder } from "@/app/(dashboard)/orders/actions";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { SelectOrderType } from "@/zod-schema/order";
import { SelectCustomerType } from "@/zod-schema/customer";
import { SelectProductType } from "@/zod-schema/product";
import { OrderItemRow, ItemRow } from "./OrderItemRow";
import { OrderDesignFields } from "./OrderDesignFields";

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

export type ExistingItem = {
  productId: number;
  selectedColor: string;
  quantity: number;
};

type Props = {
  order?: SelectOrderType | null;
  existingItems: ExistingItem[];
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
          : { ...row, [field]: value, ...(field === "productId" ? { selectedColor: "" } : {}) }
      )
    );
  }

  function addItem() {
    setItemRows((rows) => [...rows, { productId: "", selectedColor: "", quantity: 1 }]);
  }

  function removeItem(index: number) {
    setItemRows((rows) => rows.filter((_, i) => i !== index));
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
          {itemRows.map((row, i) => (
            <OrderItemRow
              key={i}
              row={row}
              index={i}
              products={products}
              showRemove={itemRows.length > 1}
              onUpdate={updateItem}
              onRemove={removeItem}
            />
          ))}
          <Button type="button" variant="outline" onClick={addItem} className="w-full dark:text-white">
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

        <OrderDesignFields order={order} deliveryDefault={deliveryDefault} />

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
