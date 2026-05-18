import { creatInsertSchema, creatSelectSchema } from "drizzle-zod";
import { orders, orderItems } from "@/db/schema";
import { z } from "zod";

export const insertOrderItemSchema = creatInsertSchema(orderItems, {
  quantity: (schema) => schema.min(1, "Quantity must be at least 1"),
  selectColor: (schema) => schema.min(1, "Color is required"),
  unitPrice: (schema) => schema.refine((v) => parseFloat(v) >= 0, {
    message: "Unit price must be zero or more",
  }),
});

export const insertOrderSchema = creatInsertSchema(orders, {
  totalPrice: (schema) => schema.refine((val) => parseFloat(val) > 0, {
    message: "Total price must be greater than 0",
  }),
}).extend({
  items: z.array(insertOrderItemSchema.omit({ orderId: true })).min(1, "At least one order item is required"),
});


export const SelectOrderSchema = creatSelectSchema(orders);
export const selectOrderItemSchema = creatSelectSchema(orderItems);

export const updateOrderSchema = insertOrderSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertOrderType = z.infer<typeof insertOrderSchema>;
export type SelectOrderType = z.infer<typeof SelectOrderSchema>;
export type SelectOrderItemType = z.infer<typeof selectOrderItemSchema>;


