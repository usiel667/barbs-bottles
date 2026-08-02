"use client";

import { useActionState, useState, useTransition } from "react";
import { createProduct, updateProduct, createProductSeries, createBottleSize } from "@/app/(dashboard)/products/actions";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { SelectProductType } from "@/zod-schema/product";
import { SelectProductDesignType } from "@/zod-schema/productDesign";

type SeriesOption = { id: number; name: string };
type SizeOption = { id: number; code: string; description: string };

type FormState = {
  errors?: Record<string, string[]>;
} | null;

function FieldError({ errors }: { errors?: string[] }) {
  if (!errors?.length) return null;
  return <p className="text-sm text-red-600 mt-1">{errors[0]}</p>;
}

type DesignRowState = {
  name: string;
  price: string;
  msrpPrice: string;
  quantity: string;
};

const emptyDesignRow: DesignRowState = { name: "", price: "", msrpPrice: "", quantity: "0" };

type Props = {
  product?: SelectProductType | null;
  designs?: SelectProductDesignType[];
  allSeries: SeriesOption[];
  allSizes: SizeOption[];
  productNames: string[];
};

export function ProductForm({ product, designs, allSeries, allSizes, productNames }: Props) {
  const isEditing = Boolean(product);

  const action = isEditing
    ? updateProduct.bind(null, product!.id)
    : createProduct;

  const [state, formAction, isPending] = useActionState<FormState, FormData>(
    action,
    null
  );

  const [designRows, setDesignRows] = useState<DesignRowState[]>(() =>
    designs?.length
      ? designs.map((d) => ({
        name: d.name,
        price: d.price,
        msrpPrice: d.msrpPrice ?? "",
        quantity: String(d.quantity),
      }))
      : []
  );

  function addDesignRow() {
    setDesignRows((rows) => [...rows, { ...emptyDesignRow }]);
  }

  function removeDesignRow(index: number) {
    setDesignRows((rows) => rows.filter((_, i) => i !== index));
  }

  function updateDesignRow(index: number, field: keyof DesignRowState, value: string) {
    setDesignRows((rows) =>
      rows.map((row, i) => (i === index ? { ...row, [field]: value } : row))
    );
  }

  // Product Name — dropdown of existing names + inline "Add" for a brand-new one
  const [nameOptions, setNameOptions] = useState(productNames);
  const [name, setName] = useState(product?.name ?? "");
  const [addingName, setAddingName] = useState(false);
  const [newName, setNewName] = useState("");

  function confirmNewName() {
    const trimmed = newName.trim();
    if (!trimmed) return;
    setNameOptions((opts) => (opts.includes(trimmed) ? opts : [...opts, trimmed]));
    setName(trimmed);
    setNewName("");
    setAddingName(false);
  }

  // Series — dropdown backed by product_series lookup + inline "Add"
  const [seriesOptions, setSeriesOptions] = useState(allSeries);
  const [seriesId, setSeriesId] = useState(product?.seriesId ? String(product.seriesId) : "");
  const [addingSeries, setAddingSeries] = useState(false);
  const [newSeriesName, setNewSeriesName] = useState("");
  const [seriesError, setSeriesError] = useState<string | null>(null);
  const [isSeriesPending, startSeriesTransition] = useTransition();

  function submitNewSeries() {
    const trimmed = newSeriesName.trim();
    if (!trimmed) return;
    setSeriesError(null);
    startSeriesTransition(async () => {
      const result = await createProductSeries(trimmed);
      if ("error" in result) {
        setSeriesError(result.error);
        return;
      }
      setSeriesOptions((opts) => [...opts, result.data]);
      setSeriesId(String(result.data.id));
      setNewSeriesName("");
      setAddingSeries(false);
    });
  }

  // Size — dropdown backed by bottle_sizes lookup + inline "Add"
  const [sizeOptions, setSizeOptions] = useState(allSizes);
  const [sizeId, setSizeId] = useState(product?.sizeId ? String(product.sizeId) : "");
  const [addingSize, setAddingSize] = useState(false);
  const [newSizeCode, setNewSizeCode] = useState("");
  const [newSizeDescription, setNewSizeDescription] = useState("");
  const [sizeError, setSizeError] = useState<string | null>(null);
  const [isSizePending, startSizeTransition] = useTransition();

  function submitNewSize() {
    const code = newSizeCode.trim();
    const description = newSizeDescription.trim() || code;
    if (!code) return;
    setSizeError(null);
    startSizeTransition(async () => {
      const result = await createBottleSize(code, description);
      if ("error" in result) {
        setSizeError(result.error);
        return;
      }
      setSizeOptions((opts) => [...opts, result.data]);
      setSizeId(String(result.data.id));
      setNewSizeCode("");
      setNewSizeDescription("");
      setAddingSize(false);
    });
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {isEditing ? "Edit Product" : "Add Product"}
        </h1>
        <Button asChild variant="outline" className="dark:text-white bg-blue-600 hover:bg-blue-700">
          <Link href="/products">Back to Products</Link>
        </Button>
      </div>

      <form action={formAction} className="space-y-6 bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border">

        {/* Product Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Product Name <span className="text-red-500">*</span>
          </label>
          <div className="flex gap-2">
            <select
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border rounded-md px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            >
              <option value="">Select product name</option>
              {nameOptions.map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
            <Button type="button" variant="outline" size="sm" onClick={() => setAddingName((v) => !v)} className="dark:text-white shrink-0">
              Add Product Name
            </Button>
          </div>
          {addingName && (
            <div className="flex gap-2 mt-2">
              <input
                type="text"
                placeholder="New product name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="w-full border rounded-md px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
              <Button type="button" size="sm" onClick={confirmNewName} className="bg-blue-600 hover:bg-blue-700 text-white shrink-0">
                Add
              </Button>
            </div>
          )}
          <input type="hidden" name="name" value={name} />
          <FieldError errors={state?.errors?.name} />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Description
          </label>
          <textarea
            name="description"
            rows={2}
            defaultValue={product?.description ?? ""}
            className="w-full border rounded-md px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          />
        </div>

        {/* Series + Size */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Series <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-2">
              <select
                value={seriesId}
                onChange={(e) => setSeriesId(e.target.value)}
                className="w-full border rounded-md px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              >
                <option value="">Select series</option>
                {seriesOptions.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
              <Button type="button" variant="outline" size="sm" onClick={() => setAddingSeries((v) => !v)} className="dark:text-white shrink-0">
                Add
              </Button>
            </div>
            {addingSeries && (
              <div className="flex gap-2 mt-2">
                <input
                  type="text"
                  placeholder="New series name"
                  value={newSeriesName}
                  onChange={(e) => setNewSeriesName(e.target.value)}
                  className="w-full border rounded-md px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
                <Button type="button" size="sm" disabled={isSeriesPending} onClick={submitNewSeries} className="bg-blue-600 hover:bg-blue-700 text-white shrink-0">
                  Add
                </Button>
              </div>
            )}
            {seriesError && <p className="text-sm text-red-600 mt-1">{seriesError}</p>}
            <input type="hidden" name="seriesId" value={seriesId} />
            <FieldError errors={state?.errors?.seriesId} />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Size <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-2">
              <select
                value={sizeId}
                onChange={(e) => setSizeId(e.target.value)}
                className="w-full border rounded-md px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              >
                <option value="">Select size</option>
                {sizeOptions.map((s) => (
                  <option key={s.id} value={s.id}>{s.description}</option>
                ))}
              </select>
              <Button type="button" variant="outline" size="sm" onClick={() => setAddingSize((v) => !v)} className="dark:text-white shrink-0">
                Add
              </Button>
            </div>
            {addingSize && (
              <div className="space-y-2 mt-2">
                <input
                  type="text"
                  placeholder="Size code (e.g. 32oz)"
                  value={newSizeCode}
                  onChange={(e) => setNewSizeCode(e.target.value)}
                  className="w-full border rounded-md px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Description (optional)"
                    value={newSizeDescription}
                    onChange={(e) => setNewSizeDescription(e.target.value)}
                    className="w-full border rounded-md px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                  <Button type="button" size="sm" disabled={isSizePending} onClick={submitNewSize} className="bg-blue-600 hover:bg-blue-700 text-white shrink-0">
                    Add
                  </Button>
                </div>
              </div>
            )}
            {sizeError && <p className="text-sm text-red-600 mt-1">{sizeError}</p>}
            <input type="hidden" name="sizeId" value={sizeId} />
            <FieldError errors={state?.errors?.sizeId} />
          </div>
        </div>

        {/* Cold + Hot Retention */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Cold Retention (hrs)
            </label>
            <input
              type="number"
              name="coldRetentionHours"
              defaultValue={product?.coldRetentionHours ?? ""}
              className="w-full border rounded-md px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Hot Retention (hrs)
            </label>
            <input
              type="number"
              name="hotRetentionHours"
              defaultValue={product?.hotRetentionHours ?? ""}
              className="w-full border rounded-md px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
          </div>
        </div>

        {/* Warranty */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Warranty
          </label>
          <input
            type="text"
            name="warranty"
            defaultValue={product?.warranty ?? "lifetime"}
            className="w-full border rounded-md px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          />
        </div>

        {/* Toggles */}
        <div className="flex gap-6">
          <div className="flex items-center gap-2">
            <input type="hidden" name="hasHandle" value="false" />
            <input
              type="checkbox"
              name="hasHandle"
              value="true"
              defaultChecked={product?.hasHandle ?? false}
              className="h-4 w-4"
            />
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Has Handle</label>
          </div>
          <div className="flex items-center gap-2">
            <input type="hidden" name="leakProof" value="false" />
            <input
              type="checkbox"
              name="leakProof"
              value="true"
              defaultChecked={product?.leakProof ?? false}
              className="h-4 w-4"
            />
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Leak Proof</label>
          </div>
        </div>

        {/* Designs */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Designs <span className="text-red-500">*</span>
            </label>
            <Button type="button" variant="outline" size="sm" onClick={addDesignRow} className="dark:text-white">
              Add Design
            </Button>
          </div>
          <input type="hidden" name="designCount" value={designRows.length} />
          <div className="space-y-2">
            {designRows.map((row, i) => (
              <div key={i} className="grid grid-cols-5 gap-2 items-end border rounded-md p-3 dark:border-gray-600">
                <div className="col-span-2">
                  <input
                    type="text"
                    placeholder="Design name"
                    value={row.name}
                    onChange={(e) => updateDesignRow(i, "name", e.target.value)}
                    name={`designs[${i}][name]`}
                    className="w-full border rounded-md px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="Price"
                  value={row.price}
                  onChange={(e) => updateDesignRow(i, "price", e.target.value)}
                  name={`designs[${i}][price]`}
                  className="w-full border rounded-md px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="MSRP (optional)"
                  value={row.msrpPrice}
                  onChange={(e) => updateDesignRow(i, "msrpPrice", e.target.value)}
                  name={`designs[${i}][msrpPrice]`}
                  className="w-full border rounded-md px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
                <div className="flex gap-2 items-end">
                  <input
                    type="number"
                    min="0"
                    step="1"
                    placeholder="Qty"
                    value={row.quantity}
                    onChange={(e) => updateDesignRow(i, "quantity", e.target.value)}
                    name={`designs[${i}][quantity]`}
                    className="w-full border rounded-md px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                  <input type="hidden" name={`designs[${i}][inStock]`} value={String(Number(row.quantity) > 0)} />
                  <button
                    type="button"
                    onClick={() => removeDesignRow(i)}
                    className="text-sm text-red-600 hover:text-red-700 px-1"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
          <FieldError errors={state?.errors?.designs} />
        </div>

        {/* Active */}
        <div className="flex items-center gap-2">
          <input type="hidden" name="active" value="false" />
          <input
            type="checkbox"
            name="active"
            value="true"
            defaultChecked={product?.active ?? true}
            className="h-4 w-4"
          />
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Active</label>
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
