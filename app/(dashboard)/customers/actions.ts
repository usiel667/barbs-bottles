"use server";

import { db } from "@/db";
import { customers } from "@/db/schema";
import { insertCustomerSchema, updateCustomerSchema } from "@/zod-schema/customer";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
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
  //Auth Check
  const { getUser } = getKindeServerSession();
  const user = await getUser();
  if (!user) throw new Error("Unathorized");

  const raw = parseFormData(formData);
  const parsed = insertCustomerSchema.safeParse(raw);
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };

  }
  try {
    await db.insert(customers).values(parsed.data);
  } catch (e) {
    if (
      e instanceof Error &&
      "code" in e &&
      (e as { code: string }).code === "23505"
    ) {
      return { errors: { email: ["This email is already in use"] } };
    }
    throw e;
  }

  revalidatePath("/customers");
  redirect("/customers");
}


export async function updateCustomer(
  id: number,
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  // [HIGH FIX] Auth check
  const { getUser } = getKindeServerSession();
  const user = await getUser();
  if (!user) throw new Error("Unauthorized");

  const raw = parseFormData(formData);

  // [LOW FIX] Use updateCustomerSchema so createdAt/updatedAt cannot be
  // sent in a crafted request and overwritten in the DB
  const parsed = updateCustomerSchema.safeParse(raw);
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  // [MEDIUM FIX] Same unique constraint handling for update
  try {
    await db.update(customers).set(parsed.data).where(eq(customers.id, id));
  } catch (e) {
    if (
      e instanceof Error &&
      "code" in e &&
      (e as { code: string }).code === "23505"
    ) {
      return { errors: { email: ["This email is already in use"] } };
    }
    throw e;
  }

  revalidatePath("/customers");
  redirect("/customers");
}
