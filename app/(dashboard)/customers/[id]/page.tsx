import Link from "next/link";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { getCustomerById, getCustomerOrders } from "@/lib/queries/customers";
import { CustomerDetailsCard } from "./CustomerDetailsCard";
import { CustomerOrdersCard } from "./CustomerOrdersCard";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function CustomerDetailPage({ params }: Props) {
  const { id } = await params;
  const customerId = parseInt(id, 10);
  if (isNaN(customerId)) notFound();

  const [customer, orders] = await Promise.all([
    getCustomerById(customerId),
    getCustomerOrders(customerId),
  ]);
  if (!customer) notFound();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Customer</h1>
          <p className="text-gray-600 dark:text-gray-300">
            {customer.firstName} {customer.lastName}
          </p>
        </div>
        <Button asChild className="bg-blue-600 hover:bg-blue-700 text-white">
          <Link href="/customers">Back to Customers</Link>
        </Button>
      </div>

      <CustomerDetailsCard customer={customer} />
      <CustomerOrdersCard orders={orders} />
    </div>
  );
}
