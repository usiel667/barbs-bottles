import { SelectOrderType } from "@/zod-schema/order";

type Props = {
  order?: SelectOrderType | null;
  deliveryDefault: string;
};

export function OrderDesignFields({ order, deliveryDefault }: Props) {
  return (
    <>
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
    </>
  );
}
