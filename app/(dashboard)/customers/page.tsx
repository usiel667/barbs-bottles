import { db } from "@/db";
import { customers } from "@/db/schema";
import { desc } from "drizzle-orm";
import { Users, Plus, Mail, Phone, MapPin } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function CustomersPage() {
  const allCustomers = await db
    .select()
    .from(customers)
    .orderBy(desc(customers.createdAt));

  return (
    <div className="space-y-6">

      {/* Page header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Customers
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            {allCustomers.length} customer{allCustomers.length !== 1 ? "s" : ""} total
          </p>
        </div>
        <Button asChild className="bg-blue-600 hover:bg-blue-700 text-white">
          <Link href="/customers/form">
            <Plus className="h-4 w-4" />
            Add Customer
          </Link>
        </Button>
      </div>

      {allCustomers.length === 0 ? (

        /* Empty state */
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border p-12 text-center">
          <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            No customers yet
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Get started by adding your first customer.
          </p>
          <Button asChild className="bg-blue-600 hover:bg-blue-700 text-white">
            <Link href="/customers/form">
              <Plus className="h-4 w-4" />
              Add First Customer
            </Link>
          </Button>
        </div>

      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border overflow-hidden">

          {/* Desktop table — hidden on mobile */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Contact</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Location</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Joined</th>
                  <th className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {allCustomers.map((customer) => (
                  <tr key={customer.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">

                    {/* Name + initials avatar */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-600 dark:text-blue-300 font-semibold text-sm shrink-0">
                          {customer.firstName[0] ?? ""}{customer.lastName[0] ?? ""}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {customer.firstName} {customer.lastName}
                          </p>
                          {customer.notes && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-xs">
                              {customer.notes}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Contact */}
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1 text-gray-700 dark:text-gray-300">
                          <Mail className="h-3.5 w-3.5 text-gray-400" />
                          <a href={`mailto:${customer.email}`} className="hover:text-blue-600 hover:underline">
                            {customer.email}
                          </a>
                        </div>
                        <div className="flex items-center gap-1 text-gray-700 dark:text-gray-300">
                          <Phone className="h-3.5 w-3.5 text-gray-400" />
                          <a href={`tel:${customer.phone}`} className="hover:underline">
                            {customer.phone}
                          </a>
                        </div>
                      </div>
                    </td>

                    {/* Location */}
                    <td className="px-6 py-4">
                      <div className="flex items-start gap-1 text-gray-700 dark:text-gray-300">
                        <MapPin className="h-3.5 w-3.5 text-gray-400 mt-0.5 shrink-0" />
                        <div className="text-sm">
                          <p>{customer.address1}</p>
                          {customer.address2 && <p>{customer.address2}</p>}
                          <p>{customer.city}, {customer.state} {customer.zipCode}</p>
                        </div>
                      </div>
                    </td>

                    {/* Status badge */}
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${customer.active
                        ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                        : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
                        }`}>
                        {customer.active ? "Active" : "Inactive"}
                      </span>
                    </td>

                    {/* Joined date */}
                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                      {new Date(customer.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </td>

                    {/* Edit action */}
                    <td className="px-6 py-4 text-right">
                      <Button asChild className="bg-blue-600 hover:bg-blue-700 text-white" size="sm">
                        <Link href={`/customers/form?id=${customer.id}`}>Edit</Link>
                      </Button>
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile card list — hidden on desktop */}
          <div className="md:hidden divide-y divide-gray-200 dark:divide-gray-700">
            {allCustomers.map((customer) => (
              <div key={customer.id} className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-600 dark:text-blue-300 font-semibold">
                      {customer.firstName[0] ?? ""}{customer.lastName[0] ?? ""}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {customer.firstName} {customer.lastName}
                      </p>
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${customer.active
                        ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                        : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
                        }`}>
                        {customer.active ? "Active" : "Inactive"}
                      </span>
                    </div>
                  </div>
                  <Button asChild variant="ghost" size="sm">
                    <Link href={`/customers/form?id=${customer.id}`}>Edit</Link>
                  </Button>
                </div>

                <div className="space-y-1 text-sm text-gray-700 dark:text-gray-300">
                  <div className="flex items-center gap-1.5">
                    <Mail className="h-3.5 w-3.5 text-gray-400" />
                    <a href={`mailto:${customer.email}`} className="hover:underline">{customer.email}</a>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Phone className="h-3.5 w-3.5 text-gray-400" />
                    <a href={`tel:${customer.phone}`} className="hover:underline">{customer.phone}</a>
                  </div>
                  <div className="flex items-start gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-gray-400 mt-0.5" />
                    <span>{customer.city}, {customer.state} {customer.zipCode}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

        </div>
      )}
    </div>
  );
}
