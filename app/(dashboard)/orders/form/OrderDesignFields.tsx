import { StatesArray } from "@/constants/StatesArray";
import type { ShippingAddress, DesignFieldsState } from "./OrderForm";

type Props = {
  designFields: DesignFieldsState;
  onDesignFieldChange: (field: keyof DesignFieldsState, value: string) => void;
  shipping: ShippingAddress;
  onShippingFieldChange: (field: keyof ShippingAddress, value: string) => void;
  errors?: Record<string, string[]>;
};

function FieldError({ errors }: { errors?: string[] }) {
  if (!errors?.length) return null;
  return <p className="text-sm text-red-600 mt-1">{errors[0]}</p>;
}

export function OrderDesignFields({ designFields, onDesignFieldChange, shipping, onShippingFieldChange, errors }: Props) {
  return (
    <>
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Estimated Delivery <span className="text-gray-400 font-normal">(optional)</span>
        </label>
        <input
          type="date"
          name="estimatedDelivery"
          value={designFields.estimatedDelivery}
          onChange={(e) => onDesignFieldChange("estimatedDelivery", e.target.value)}
          className="w-full border rounded-md px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
        />
      </div>

      {/* Shipping Address — same layout as the customer edit form's Address
          section; auto-fills from the selected customer, editable after. */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Shipping Address
        </h2>
        <div className="grid gap-4">

          <div>
            <label htmlFor="shippingAddress1" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Address Line 1 <span className="text-red-500">*</span>
            </label>
            <input
              id="shippingAddress1" name="shippingAddress1" type="text"
              value={shipping.address1}
              onChange={(e) => onShippingFieldChange("address1", e.target.value)}
              className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="123 Main St"
            />
            <FieldError errors={errors?.shippingAddress1} />
          </div>

          <div>
            <label htmlFor="shippingAddress2" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Address Line 2
            </label>
            <input
              id="shippingAddress2" name="shippingAddress2" type="text"
              value={shipping.address2}
              onChange={(e) => onShippingFieldChange("address2", e.target.value)}
              className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Apt 4B"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-3">

            <div>
              <label htmlFor="shippingCity" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                City <span className="text-red-500">*</span>
              </label>
              <input
                id="shippingCity" name="shippingCity" type="text"
                value={shipping.city}
                onChange={(e) => onShippingFieldChange("city", e.target.value)}
                className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Springfield"
              />
              <FieldError errors={errors?.shippingCity} />
            </div>

            <div>
              <label htmlFor="shippingState" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                State <span className="text-red-500">*</span>
              </label>
              <select
                id="shippingState" name="shippingState"
                value={shipping.state}
                onChange={(e) => onShippingFieldChange("state", e.target.value)}
                className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select state</option>
                {StatesArray.map((s) => (
                  <option key={s.id} value={s.id}>{s.description}</option>
                ))}
              </select>
              <FieldError errors={errors?.shippingState} />
            </div>

            <div>
              <label htmlFor="shippingZipCode" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Zip Code <span className="text-red-500">*</span>
              </label>
              <input
                id="shippingZipCode" name="shippingZipCode" type="text"
                value={shipping.zipCode}
                onChange={(e) => onShippingFieldChange("zipCode", e.target.value)}
                className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="12345"
              />
              <FieldError errors={errors?.shippingZipCode} />
            </div>

          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Assigned To <span className="text-gray-400 font-normal">(optional)</span>
        </label>
        <input
          type="text"
          name="assignedTo"
          value={designFields.assignedTo}
          onChange={(e) => onDesignFieldChange("assignedTo", e.target.value)}
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
          value={designFields.customDesignText}
          onChange={(e) => onDesignFieldChange("customDesignText", e.target.value)}
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
          value={designFields.designNotes}
          onChange={(e) => onDesignFieldChange("designNotes", e.target.value)}
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
          value={designFields.customLogoUrl}
          onChange={(e) => onDesignFieldChange("customLogoUrl", e.target.value)}
          className="w-full border rounded-md px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
        />
      </div>
    </>
  );
}
