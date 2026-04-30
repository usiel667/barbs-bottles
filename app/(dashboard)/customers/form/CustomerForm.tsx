"use client";

import { useActionState } from "react";
import { createCustomer, updateCustomer } from "@/app/(dashboard)/customers/actions";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { SelectCustomerType } from "@/zod-schema/customer";

type FormState = {
  errors?: Record<string, string[]>;
} | null;

const US_STATES = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA",
  "HI","ID","IL","IN","IA","KS","KY","LA","ME","MD",
  "MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ",
  "NM","NY","NC","ND","OH","OK","OR","PA","RI","SC",
  "SD","TN","TX","UT","VT","VA","WA","WV","WI","WY",
];

function FieldError({ errors }: { errors?: string[] }) {
  if (!errors?.length) return null;
  return <p className="text-sm text-red-600 mt-1">{errors[0]}</p>;
}

type Props = {
  customer?: SelectCustomerType | null;
};

export function CustomerForm({ customer }: Props) {
  const isEditing = Boolean(customer);

  const action = isEditing
    ? updateCustomer.bind(null, customer!.id)
    : createCustomer;

  const [state, formAction, isPending] = useActionState<FormState, FormData>(
    action,
    null
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {isEditing ? "Edit Customer" : "Add New Customer"}
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            {isEditing
              ? `Editing ${customer!.firstName} ${customer!.lastName}`
              : "Fill in the details to add a new customer"}
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/customers">Back to Customers</Link>
        </Button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border p-6">
        <form action={formAction} className="space-y-6">
          {/* Personal Information */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Personal Information
            </h2>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label
                  htmlFor="firstName"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  First Name <span className="text-red-500">*</span>
                </label>
                <input
                  id="firstName"
                  name="firstName"
                  type="text"
                  defaultValue={customer?.firstName}
                  className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Jane"
                />
                <FieldError errors={state?.errors?.firstName} />
              </div>

              <div>
                <label
                  htmlFor="lastName"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  Last Name <span className="text-red-500">*</span>
                </label>
                <input
                  id="lastName"
                  name="lastName"
                  type="text"
                  defaultValue={customer?.lastName}
                  className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Smith"
                />
                <FieldError errors={state?.errors?.lastName} />
              </div>

              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  defaultValue={customer?.email}
                  className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="jane@example.com"
                />
                <FieldError errors={state?.errors?.email} />
              </div>

              <div>
                <label
                  htmlFor="phone"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  Phone <span className="text-red-500">*</span>
                </label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  defaultValue={customer?.phone}
                  className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="+15551234567"
                />
                <FieldError errors={state?.errors?.phone} />
              </div>
            </div>
          </div>

          {/* Address */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Address
            </h2>
            <div className="grid gap-4">
              <div>
                <label
                  htmlFor="address1"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  Address Line 1 <span className="text-red-500">*</span>
                </label>
                <input
                  id="address1"
                  name="address1"
                  type="text"
                  defaultValue={customer?.address1}
                  className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="123 Main St"
                />
                <FieldError errors={state?.errors?.address1} />
              </div>

              <div>
                <label
                  htmlFor="address2"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  Address Line 2
                </label>
                <input
                  id="address2"
                  name="address2"
                  type="text"
                  defaultValue={customer?.address2 ?? ""}
                  className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Apt 4B"
                />
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <label
                    htmlFor="city"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                  >
                    City <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="city"
                    name="city"
                    type="text"
                    defaultValue={customer?.city}
                    className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Springfield"
                  />
                  <FieldError errors={state?.errors?.city} />
                </div>

                <div>
                  <label
                    htmlFor="state"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                  >
                    State <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="state"
                    name="state"
                    defaultValue={customer?.state ?? ""}
                    className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select state</option>
                    {US_STATES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                  <FieldError errors={state?.errors?.state} />
                </div>

                <div>
                  <label
                    htmlFor="zipCode"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                  >
                    Zip Code <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="zipCode"
                    name="zipCode"
                    type="text"
                    defaultValue={customer?.zipCode}
                    className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="12345"
                  />
                  <FieldError errors={state?.errors?.zipCode} />
                </div>
              </div>
            </div>
          </div>

          {/* Additional Info */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Additional Information
            </h2>
            <div className="grid gap-4">
              <div>
                <label
                  htmlFor="notes"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  Notes
                </label>
                <textarea
                  id="notes"
                  name="notes"
                  rows={3}
                  defaultValue={customer?.notes ?? ""}
                  className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Any special notes about this customer..."
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  id="active"
                  name="active"
                  type="checkbox"
                  defaultChecked={customer?.active ?? true}
                  value="true"
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label
                  htmlFor="active"
                  className="text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Active customer
                </label>
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              type="submit"
              disabled={isPending}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isPending
                ? isEditing ? "Saving..." : "Adding..."
                : isEditing ? "Save Changes" : "Add Customer"}
            </Button>
            <Button asChild variant="outline">
              <Link href="/customers">Cancel</Link>
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
