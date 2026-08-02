"use client";

import { useActionState, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  updateProductDesignVariant,
  removeProductDesignVariant,
} from "@/app/(dashboard)/products/actions";

type FormState = {
  errors?: Record<string, string[]>;
} | null;

function FieldError({ errors }: { errors?: string[] }) {
  if (!errors?.length) return null;
  return <p className="text-sm text-red-600 mt-1">{errors[0]}</p>;
}

type Variant = {
  productDesignId: number;
  designName: string;
  price: string;
  msrpPrice: string | null;
  quantity: number;
  productId: number;
  productName: string;
  coldRetentionHours: number | null;
  hotRetentionHours: number | null;
  warranty: string | null;
  hasHandle: boolean;
  leakProof: boolean;
  active: boolean;
  series: string;
  size: string;
};

type Props = {
  variant: Variant;
  productNames: string[];
  designNames: string[];
};

export function SingleVariantEditor({ variant, productNames, designNames }: Props) {
  const router = useRouter();
  const action = updateProductDesignVariant.bind(null, variant.productDesignId);
  const [state, formAction, isPending] = useActionState<FormState, FormData>(action, null);

  const [addingName, setAddingName] = useState(false);
  const [name, setName] = useState(variant.productName);
  const [newName, setNewName] = useState("");

  function confirmNewName() {
    const trimmed = newName.trim();
    if (!trimmed) return;
    setName(trimmed);
    setNewName("");
    setAddingName(false);
  }

  const [isRemoving, startRemoveTransition] = useTransition();
  const [removeError, setRemoveError] = useState<string | null>(null);

  function handleRemove() {
    if (!confirm(`Remove "${variant.designName}" (${variant.series} / ${variant.size})? This can't be undone.`)) {
      return;
    }
    setRemoveError(null);
    startRemoveTransition(async () => {
      const result = await removeProductDesignVariant(variant.productDesignId);
      if (result && "error" in result) {
        setRemoveError(result.error);
        return;
      }
      router.push("/products");
    });
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Edit Design Variant
        </h1>
        <Button asChild variant="outline" className="dark:text-white bg-blue-600 hover:bg-blue-700">
          <Link href="/products">Back to Products</Link>
        </Button>
      </div>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
        {variant.series} · {variant.size}
      </p>

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
              {!productNames.includes(name) && <option value={name}>{name}</option>}
              {productNames.map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
            <Button type="button" variant="outline" size="sm" onClick={() => setAddingName((v) => !v)} className="dark:text-white shrink-0">
              Add
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

        {/* Design Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Design Name <span className="text-red-500">*</span>
          </label>
          <select
            name="designName"
            defaultValue={variant.designName}
            className="w-full border rounded-md px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          >
            {designNames.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
          <FieldError errors={state?.errors?.designName} />
        </div>

        <p className="text-xs text-gray-500 dark:text-gray-400 -mb-2">
          The fields below apply to every design on this product ({variant.series} · {variant.size}), not just {variant.designName}.
        </p>

        {/* Cold + Hot Retention */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Cold Retention (hrs)
            </label>
            <input
              type="number"
              name="coldRetentionHours"
              defaultValue={variant.coldRetentionHours ?? ""}
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
              defaultValue={variant.hotRetentionHours ?? ""}
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
            defaultValue={variant.warranty ?? "lifetime"}
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
              defaultChecked={variant.hasHandle}
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
              defaultChecked={variant.leakProof}
              className="h-4 w-4"
            />
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Leak Proof</label>
          </div>
        </div>

        {/* Price / MSRP / Quantity */}
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Price <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              name="price"
              defaultValue={variant.price}
              className="w-full border rounded-md px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
            <FieldError errors={state?.errors?.price} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              MSRP
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              name="msrpPrice"
              defaultValue={variant.msrpPrice ?? ""}
              className="w-full border rounded-md px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Quantity
            </label>
            <input
              type="number"
              min="0"
              step="1"
              name="quantity"
              defaultValue={variant.quantity}
              className="w-full border rounded-md px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
            <FieldError errors={state?.errors?.quantity} />
          </div>
        </div>

        {/* Active */}
        <div className="flex items-center gap-2">
          <input type="hidden" name="active" value="false" />
          <input
            type="checkbox"
            name="active"
            value="true"
            defaultChecked={variant.active}
            className="h-4 w-4"
          />
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Active</label>
        </div>

        {removeError && <p className="text-sm text-red-600">{removeError}</p>}

        {/* Actions */}
        <div className="flex items-center justify-between pt-2">
          <div className="flex gap-3">
            <Button type="submit" disabled={isPending} className="bg-blue-600 hover:bg-blue-700 text-white">
              {isPending ? "Saving..." : "Update Design"}
            </Button>
            <Button asChild variant="outline" className="dark:text-white">
              <Link href="/products">Cancel</Link>
            </Button>
          </div>
          <Button
            type="button"
            variant="outline"
            disabled={isRemoving}
            onClick={handleRemove}
            className="text-red-600 border-red-300 hover:bg-red-50 dark:hover:bg-red-950"
          >
            {isRemoving ? "Removing..." : "Remove"}
          </Button>
        </div>

      </form>
    </div>
  );
}
