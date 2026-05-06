"use client";

import { useActionState } from "react";
import { createProduct, updateProduct } from "@/app/(dashboard)/products/actions";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { SelectProductType } from "@/zod-schema/product";
import { BottleSizes, BottleMaterials, AvailableColors } from "@/constants/ProductConstants";

type FormState = {
  errors?: Record<string, string[]>;
} | null;

function FieldError({ errors }: { errors?: string[] }) {
  if (!errors?.length) return null;
  return <p className="text-sm text-red-600 mt-1">{errors[0]}</p>;
}

type Props = {
  product?: SelectProductType | null;
};

export function ProductForm({ product }: Props) {
  const isEditing = Boolean(product);

  // Parse the stored JSON colors string back to an array for defaultChecked comparisons
  let selectedColors: string[] = [];
  if (product?.colors) {
    try {
      selectedColors = JSON.parse(product.colors);
    } catch {
      selectedColors = [];
    }
  }

  const action = isEditing
    ? updateProduct.bind(null, product!.id)
    : createProduct;

  const [state, formAction, isPending] = useActionState<FormState, FormData>(
    action,
    null
  );

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {isEditing ? "Edit Product" : "Add Product"}
        </h1>
        <Button asChild variant="outline" className="dark:text-white">
          <Link href="/products">Cancel</Link>
        </Button>
      </div>

      <form action={formAction} className="space-y-6 bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border">

        {/* Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Product Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="name"
            defaultValue={product?.name ?? ""}
            className="w-full border rounded-md px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          />
          <FieldError errors={state?.errors?.name} />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Description
          </label>
          <textarea
            name="description"
            rows={3}
            defaultValue={product?.description ?? ""}
            className="w-full border rounded-md px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          />
          <FieldError errors={state?.errors?.description} />
        </div>

        {/* Size + Material */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Size <span className="text-red-500">*</span>
            </label>
            <select
              name="size"
              defaultValue={product?.size ?? ""}
              className="w-full border rounded-md px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            >
              <option value="">Select size</option>
              {BottleSizes.map((s) => (
                <option key={s.id} value={s.id}>{s.description}</option>
              ))}
            </select>
            <FieldError errors={state?.errors?.size} />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Material <span className="text-red-500">*</span>
            </label>
            <select
              name="material"
              defaultValue={product?.material ?? ""}
              className="w-full border rounded-md px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            >
              <option value="">Select material</option>
              {BottleMaterials.map((m) => (
                <option key={m.id} value={m.id}>{m.description}</option>
              ))}
            </select>
            <FieldError errors={state?.errors?.material} />
          </div>
        </div>

        {/* Base Price */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Base Price ($) <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            name="basePrice"
            step="0.01"
            min="0"
            defaultValue={product?.basePrice ?? ""}
            className="w-full border rounded-md px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          />
          <FieldError errors={state?.errors?.basePrice} />
        </div>

        {/* Colors */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Available Colors <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-2 gap-2">
            {AvailableColors.map((color) => (
              <label key={color.id} className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                <input
                  type="checkbox"
                  name="colors"
                  value={color.id}
                  defaultChecked={selectedColors.includes(color.id)}
                />
                {color.description}
              </label>
            ))}
          </div>
          <FieldError errors={state?.errors?.colors} />
        </div>

        {/* Features */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Features <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <textarea
            name="features"
            rows={2}
            defaultValue={product?.features ?? ""}
            placeholder="e.g. Double-wall insulated, BPA-free lid"
            className="w-full border rounded-md px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          />
          <FieldError errors={state?.errors?.features} />
        </div>

        {/* Design Template URL */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Design Template URL <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <input
            type="url"
            name="designTemplate"
            defaultValue={product?.designTemplate ?? ""}
            className="w-full border rounded-md px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          />
          <FieldError errors={state?.errors?.designTemplate} />
        </div>

        {/* Design Preview URL */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Design Preview URL <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <input
            type="url"
            name="designPreview"
            defaultValue={product?.designPreview ?? ""}
            className="w-full border rounded-md px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          />
          <FieldError errors={state?.errors?.designPreview} />
        </div>

        {/* Active */}
        <div className="flex items-center gap-2">
          <input
            type="hidden"
            name="active"
            value="false"
          />
          <input
            type="checkbox"
            name="active"
            value="true"
            defaultChecked={product?.active ?? true}
            className="h-4 w-4"
          />
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Active
          </label>
        </div>

        {/* Submit */}
        <div className="flex gap-3 pt-2">
          <Button type="submit" disabled={isPending} className="bg-blue-600 hover:bg-blue-700 text-white">
            {isPending ? "Saving..." : isEditing ? "Update Product" : "Add Product"}
          </Button>
          <Button asChild variant="outline" className="dark:text-white">
            <Link href="/products">Cancel</Link>
          </Button>
        </div>

      </form>
    </div>
  );
}
