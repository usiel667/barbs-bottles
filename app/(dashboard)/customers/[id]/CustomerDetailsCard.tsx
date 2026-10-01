import Link from "next/link";
import { Mail, Phone } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AddressMap } from "@/components/AddressMap";
import { StatesArray } from "@/constants/StatesArray";
import { formatAddress, getMapEmbedUrl } from "@/lib/maps";
import type { SelectCustomerType } from "@/zod-schema/customer";

const SECTION_DIVIDER = "border-t-2 border-gray-300 dark:border-gray-600 pt-8";
const SECTION_HEADING = "text-lg font-semibold text-gray-900 dark:text-white mb-4";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">{label}</p>
      <div className="text-sm text-gray-900 dark:text-white">{children}</div>
    </div>
  );
}

const Empty = ({ text }: { text: string }) => (
  <span className="text-gray-400 italic">{text}</span>
);

type ContactFieldProps = {
  label: string;
  icon: LucideIcon;
  value: string | null;
  hrefPrefix: "mailto:" | "tel:";
  emptyText: string;
};

function ContactField({ label, icon: Icon, value, hrefPrefix, emptyText }: ContactFieldProps) {
  return (
    <Field label={label}>
      <div className="flex items-center gap-1">
        <Icon className="h-3.5 w-3.5 text-gray-400" />
        {value ? (
          <a href={`${hrefPrefix}${value}`} className="hover:text-blue-600 hover:underline">
            {value}
          </a>
        ) : (
          <Empty text={emptyText} />
        )}
      </div>
    </Field>
  );
}

function ActiveBadge({ active }: { active: boolean }) {
  const colors = active
    ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
    : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${colors}`}>
      {active ? "Active" : "Inactive"}
    </span>
  );
}

function PersonalInfoSection({ customer }: { customer: SelectCustomerType }) {
  return (
    <div>
      <h2 className={SECTION_HEADING}>Personal Information</h2>
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="First Name">{customer.firstName}</Field>
        <Field label="Last Name">{customer.lastName}</Field>
        <ContactField label="Email" icon={Mail} value={customer.email} hrefPrefix="mailto:" emptyText="No email" />
        <ContactField label="Phone" icon={Phone} value={customer.phone} hrefPrefix="tel:" emptyText="No phone" />
      </div>
    </div>
  );
}

function AddressFields({ customer }: { customer: SelectCustomerType }) {
  const stateName = StatesArray.find((s) => s.id === customer.state)?.description ?? customer.state;
  return (
    <div className="grid content-start gap-4">
      <Field label="Address Line 1">{customer.address1}</Field>
      {customer.address2 && <Field label="Address Line 2">{customer.address2}</Field>}
      <Field label="City">{customer.city}</Field>
      <Field label="State">{stateName}</Field>
      <Field label="Zip Code">{customer.zipCode}</Field>
    </div>
  );
}

function AddressSection({ customer }: { customer: SelectCustomerType }) {
  const address = formatAddress(customer);
  return (
    <div className={SECTION_DIVIDER}>
      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <h2 className={SECTION_HEADING}>Address</h2>
          <AddressFields customer={customer} />
        </div>
        <AddressMap embedUrl={getMapEmbedUrl(address)} address={address} />
      </div>
    </div>
  );
}

function AdditionalInfoSection({ customer }: { customer: SelectCustomerType }) {
  return (
    <div className={SECTION_DIVIDER}>
      <h2 className={SECTION_HEADING}>Additional Information</h2>
      <div className="grid gap-4">
        <Field label="Notes">
          {customer.notes ? (
            <p className="whitespace-pre-wrap">{customer.notes}</p>
          ) : (
            <Empty text="No notes" />
          )}
        </Field>
        <Field label="Status">
          <ActiveBadge active={customer.active} />
        </Field>
      </div>
    </div>
  );
}

export function CustomerDetailsCard({ customer }: { customer: SelectCustomerType }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border p-6 space-y-8">
      <PersonalInfoSection customer={customer} />
      <AddressSection customer={customer} />
      <AdditionalInfoSection customer={customer} />
      <div className={`flex gap-3 ${SECTION_DIVIDER}`}>
        <Button asChild className="bg-blue-600 hover:bg-blue-700 text-white">
          <Link href={`/customers/form?id=${customer.id}`}>Edit</Link>
        </Button>
      </div>
    </div>
  );
}
