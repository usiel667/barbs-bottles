"use client"

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronRight } from "lucide-react";

const STATUS_CLASSES: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  design: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  production: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
  quality_check: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
  shipped: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300",
  delivered: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  canceled: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300",
};

const STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  design: "Design",
  production: "Production",
  quality_check: "Quality Check",
  shipped: "Shipped",
  delivered: "Delivered",
  canceled: "Canceled",
};

type OrderItem = {
  orderId: number;
  quantity: number;
  selectedColor: string;
  unitPrice: string | number;
  discount: string | number | null;
  productName: string;
  productSize: string;
};

type Order = {
  id: number;
  status: string;
  totalPrice: string | number;
  estimatedDelivery: Date | null;
  createdAt: Date;
  customerFirstName: string;
  customerLastName: string;
}

type Props = {
  order: Order;
  items: OrderItem[];
}

export function OrderRow({ order, items }: Props) {
  const [expanded, setExpanded] = useState(false);

  const subtotal = items.reduce((sum, item) => {
    const price = parseFloat(String(item.unitPrice)) || 0;
    const disc = parseFloat(String(item.discount ?? 0)) || 0;
    return sum + price * item.quantity * (1 - disc / 100);
  }, 0);

  return (
    <>
      {/* Main Row */}
      <tr
        className="hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
        onClick={() => setExpanded((v) => !v)}
      >
        <td className="px-4 py-4 text-gray-400">
          {expanded
            ? <ChevronDown className="h-4 w-4" />
            : <ChevronRight className="h-4 w-4" />}
        </td>
        <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">#{order.id}</td>
        <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
          {order.customerFirstName} {order.customerLastName}
        </td>
        <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
          {items.length} item{items.length !== 1 ? "s" : ""}
        </td>
        <td className="px-6 py-4">
          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_CLASSES[order.status] ?? ""}`}>
            {STATUS_LABELS[order.status] ?? order.status}
          </span>
        </td>
        <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
          ${Number(order.totalPrice).toFixed(2)}
        </td>
        <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
          {new Date(order.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
        </td>
        <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
          <Button asChild size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
            <Link href={`/orders/form?id=${order.id}`}>Edit</Link>
          </Button>
        </td>
      </tr>

      {/* Expanded items panel */}
      {expanded && (
        <tr>
          <td colSpan={8} className="px-6 pb-4 bg-gray-50 dark:bg-gray-900">
            <table className="min-w-full text-sm mt-2">
              <thead>
                <tr className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase border-b dark:border-gray-700">
                  <th className="pb-2 text-left">Product</th>
                  <th className="pb-2 text-left">Size</th>
                  <th className="pb-2 text-left">Color</th>
                  <th className="pb-2 text-right">Unit Price</th>
                  <th className="pb-2 text-right">Qty</th>
                  <th className="pb-2 text-right">Disc.</th>
                  <th className="pb-2 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {items.map((item, i) => {
                  const price = parseFloat(String(item.unitPrice)) || 0;
                  const disc = parseFloat(String(item.discount ?? 0)) || 0;
                  const lineTotal = price * item.quantity * (1 - disc / 100);
                  return (
                    <tr key={i}>
                      <td className="py-2 text-gray-900 dark:text-white font-medium">{item.productName}</td>
                      <td className="py-2 text-gray-600 dark:text-gray-400">{item.productSize}</td>
                      <td className="py-2 capitalize text-gray-600 dark:text-gray-400">{item.selectedColor}</td>
                      <td className="py-2 text-right text-gray-700 dark:text-gray-300">${price.toFixed(2)}</td>
                      <td className="py-2 text-right text-gray-700 dark:text-gray-300">×{item.quantity}</td>
                      <td className="py-2 text-right text-gray-500 dark:text-gray-400">
                        {disc > 0 ? `${disc}%` : "—"}
                      </td>
                      <td className="py-2 text-right font-medium text-gray-900 dark:text-white">${lineTotal.toFixed(2)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Summary */}
            <div className="mt-3 pt-3 border-t dark:border-gray-700 space-y-1 text-sm text-right">
              <div className="flex justify-end gap-16 text-gray-600 dark:text-gray-400">
                <span>Subtotal</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-end gap-16 font-semibold text-gray-900 dark:text-white">
                <span>Total</span>
                <span>${Number(order.totalPrice).toFixed(2)}</span>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
