"use client";

import { useState } from "react";
import { useActionState } from "react";
import { createOrder, updateOrder } from "@/app/(dashboard)/orders/actions";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { SelectOrderType } from "@/zod-schema/order";
import { SelectCustomerType } from "@/zod-schema/customer";
import { OrderItemRow, ItemRow, ProductWithDesigns } from "./OrderItemRow";
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
  discount: string | null;
};

export type ShippingAddress = {
  address1: string;
  address2: string;
  city: string;
  state: string;
  zipCode: string;
};

function addressFromCustomer(customer: SelectCustomerType): ShippingAddress {
  return {
    address1: customer.address1,
    address2: customer.address2 ?? "",
    city: customer.city,
    state: customer.state,
    zipCode: customer.zipCode,
  };
}

export type DesignFieldsState = {
  estimatedDelivery: string;
  assignedTo: string;
  customDesignText: string;
  designNotes: string;
  customLogoUrl: string;
};

type Props = {
  order?: SelectOrderType | null;
  existingItems: ExistingItem[];
  customers: SelectCustomerType[];
  products: ProductWithDesigns[];
};

export function OrderForm({ order, existingItems, customers, products }: Props) {
  const isEditing = Boolean(order);

  // Customer, Status, and the fields below are kept as controlled React
  // state (rather than defaultValue) because React 19 automatically resets
  // every *uncontrolled* form field on every submit attempt — success or
  // failure (see requestFormReset in react-dom) — which was wiping these
  // fields back to their original value on every Update/Create click or
  // Enter keypress. Controlled fields are re-synced from state instead and
  // aren't affected.
  const [customerId, setCustomerId] = useState<number | "">(order?.customerId ?? "");
  const [status, setStatus] = useState<string>(order?.status ?? "pending");

  const deliveryDefault = order?.estimatedDelivery
    ? new Date(order.estimatedDelivery).toISOString().split("T")[0]
    : "";
  const [designFields, setDesignFields] = useState<DesignFieldsState>({
    estimatedDelivery: deliveryDefault,
    assignedTo: order?.assignedTo ?? "",
    customDesignText: order?.customDesignText ?? "",
    designNotes: order?.designNotes ?? "",
    customLogoUrl: order?.customLogoUrl ?? "",
  });

  function updateDesignField(field: keyof DesignFieldsState, value: string) {
    setDesignFields((f) => ({ ...f, [field]: value }));
  }

  function handleFormKeyDown(e: React.KeyboardEvent<HTMLFormElement>) {
    // Prevent Enter in any field (other than a textarea, where it should
    // insert a newline) from prematurely submitting this multi-field form.
    if (e.key === "Enter" && (e.target as HTMLElement).tagName !== "TEXTAREA") {
      e.preventDefault();
    }
  }

  const [itemRows, setItemRows] = useState<ItemRow[]>(
    existingItems.length > 0
      ? existingItems.map((item) => ({
        productId: item.productId,
        selectedColor: item.selectedColor,
        quantity: item.quantity,
        discount: item.discount ?? "0",
      }))
      : [{ productId: "", selectedColor: "", quantity: 1, discount: "0" }]
  );

  const [shipping, setShipping] = useState<ShippingAddress>({
    address1: order?.shippingAddress1 ?? "",
    address2: order?.shippingAddress2 ?? "",
    city: order?.shippingCity ?? "",
    state: order?.shippingState ?? "",
    zipCode: order?.shippingZipCode ?? "",
  });

  function handleCustomerChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const newCustomerId = e.target.value ? Number(e.target.value) : "";
    setCustomerId(newCustomerId);
    const customer = customers.find((c) => c.id === newCustomerId);
    if (customer) setShipping(addressFromCustomer(customer));
  }

  function updateShippingField(field: keyof ShippingAddress, value: string) {
    setShipping((s) => ({ ...s, [field]: value }));
  }

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
    setItemRows((rows) => [...rows, { productId: "", selectedColor: "", quantity: 1, discount: "0" }]);
  }

  function removeItem(index: number) {
    setItemRows((rows) => rows.filter((_, i) => i !== index));
  }

  const action = isEditing ? updateOrder.bind(null, order!.id) : createOrder;
  const [state, formAction, isPending] = useActionState<FormState, FormData>(action, null);

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {isEditing ? "Edit Order" : "New Order"}
        </h1>
        <Button asChild variant="outline" className="dark:text-white bg-blue-600 hover:bg-blue-700">
          <Link href="/orders">Back to Orders</Link>
        </Button>
      </div>

      <form action={formAction} onKeyDown={handleFormKeyDown} className="space-y-6 bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border">

        {/* Customer */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Customer <span className="text-red-500">*</span>
          </label>
          <select
            name="customerId"
            value={customerId}
            onChange={handleCustomerChange}
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
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full border rounded-md px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          >
            {ORDER_STATUSES.map((s) => (
              <option key={s.id} value={s.id}>{s.label}</option>
            ))}
          </select>
          <FieldError errors={state?.errors?.status} />
        </div>

        <OrderDesignFields
          designFields={designFields}
          onDesignFieldChange={updateDesignField}
          shipping={shipping}
          onShippingFieldChange={updateShippingField}
          errors={state?.errors}
        />

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
