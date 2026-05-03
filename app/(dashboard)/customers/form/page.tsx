import { db } from "@/db";
import { customers } from "@/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { CustomerForm } from "./CustomerForm";

type Props = {
  searchParams: Promise<{ id?: string }>;

};

export default async function CustomerFormPage({ searchParams }: Props) {
  const { id } = await searchParams;
  const customerId = id ? parseInt(id, 10) : null;

  if (customerId !== null && isNaN(customerId)) notFound();

  let customer = null;
  if (customerId !== null) {
    const result = await db
      .select()
      .from(customers)
      .where(eq(customers.id, customerId))
      .limit(1);

    if (!result.length) {
      notFound();
    }
    customer = result[0];
  }
  return <CustomerForm customer={customer} />;
}
