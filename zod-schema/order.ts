import { createInsertSchema } from "drizzle-zod";
import { orders } from "@/db/schema";
import { z } from "zod";

export const insertOrderSchema = createInsertSchema(orders, {
  id: z.union([z.number(), z.literal("(New)")]),
  quantity: (schema) => schema.min(1, "Quantity must be at least 1"),
  selectedColor: (schema) => schema.min(1, "Selected color is required"),
  totalPrice: (schema) => schema.refine((val) => parseFloat(val) > 0, {
    message: "Total price must be greater than 0",
  }),
});

export const selectOrderSchema = createSelectSchema(orders);

export type InsertOrderType = z.infer<typeof insertOrderSchema>;
export type SelectOrderType = z.infer<typeof selectOrderSchema>;

