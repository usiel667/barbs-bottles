import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { customers } from "@/db/shcema";
import { z } from "zod";

export const insertCustomerSchema = createInsertSchema(customers, {
  firstName: (schema) => schema.min(1, "First name is required"),
  lastName: (schema) => schema.min(1, "Last name is required"),
  address1: (schema) => schema.min(1, "Address is required"),
  city: (schema) => schema.min(1, "City is required"),
  state: (schema) => schema.min(2, "State must be 2 characters").max(2, "State must be 2 characters"),
  email: (schema) => schema.email("Invalid email address"),
  zipCode: (schema) => schema.regex(/^\d{5}(-\d{4})?$/, "Invalid zip code format"),
  phone: (schema) => schema.regex(/^\+?[1-9]\d{1,14}$/, "Invalid phone number format"),

});

export const selectCustomerSchema = createSelectSchema(customers);

export type InsertCustomerType = z.infer<typeof insertCustomerSchema>;
export type SelectCustomerType = z.infer<typeof selectCustomerSchema>;

