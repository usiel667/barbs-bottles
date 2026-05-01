"use server";

import { db } from "@/db";
import { customers } from "@/db/schema";
import { insertCustomerSchema } from "@/zod-schema/customer";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

type FormState = {
  errors?: Record<string, string[]>;
} | null;

function parseFormData(formData: FormData) {
  return {
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    address1: formData.get("address1"),
    address2: formData.get("address2") || undefined,
    city: formData.get("city"),
    state: formData.get("state"),
    zipCode: formData.get("zipCode"),
    notes: formData.get("notes") || undefined,
    active: formData.get("active") === "true",
  };
}

export async function createCustomer(
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const raw = parseFormData(formData);
  const parsed = insertCustomerSchema.safeParse(raw);
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  await db.insert(customers).values(parsed.data);
  revalidatePath("/customers");
  redirect("/customers");
}

export async function updateCustomer(
  id: number,
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const raw = parseFormData(formData);
  const parsed = insertCustomerSchema.safeParse(raw);
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  await db.update(customers).set(parsed.data).where(eq(customers.id, id));
  revalidatePath("/customers");
  redirect("/customers");
}
