import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { orders, orderItems } from "@/db/schema";
import { z } from "zod";

export const insertOrderItemSchema = createInsertSchema(orderItems, {
  quantity: (schema) => schema.min(1, "Quantity must be at least 1"),
  selectedColor: (schema) => schema.min(1, "Color is required"),
  unitPrice: (schema) => schema.refine((v) => parseFloat(v) >= 0, {
    message: "Unit price must be zero or more",
  }),
});

export const insertOrderSchema = createInsertSchema(orders, {
  totalPrice: (schema) => schema.refine((val) => parseFloat(val) > 0, {
    message: "Total price must be greater than 0",
  }),
}).extend({
  items: z.array(insertOrderItemSchema.omit({ orderId: true })).min(1, "At least one order item is required"),
});


export const selectOrderSchema = createSelectSchema(orders);
export const selectOrderItemSchema = createSelectSchema(orderItems);

export const updateOrderSchema = insertOrderSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertOrderType = z.infer<typeof insertOrderSchema>;
export type SelectOrderType = z.infer<typeof selectOrderSchema>;
export type SelectOrderItemType = z.infer<typeof selectOrderItemSchema>;


