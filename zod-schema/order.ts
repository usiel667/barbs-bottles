import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { orders, orderItems } from "@/db/schema";
import { z } from "zod";

const insertOrderItemSchema = createInsertSchema(orderItems, {
  quantity: (schema) => schema.min(1, "Quantity must be at least 1"),
  selectedColor: (schema) => schema.min(1, "Color is required"),
  unitPrice: (schema) => schema.refine((v) => parseFloat(v) >= 0, {
    message: "Unit price must be zero or more",
  }),
  discount: (schema) => schema.refine((v) => {
    const n = parseFloat(v);
    return !isNaN(n) && n >= 0 && n <= 100;
  }, {
    message: "Discount must be between 0 and 100",
  }),
});

export const insertOrderSchema = createInsertSchema(orders, {
  totalPrice: (schema) => schema.refine((val) => parseFloat(val) >= 0, {
    message: "Total price must be zero or greater",
  }),
  shippingAddress1: (schema) => schema.min(1, "Shipping address is required"),
  shippingCity: (schema) => schema.min(1, "Shipping city is required"),
  shippingState: (schema) => schema.min(2, "State must be 2 characters").max(2, "State must be 2 characters"),
  shippingZipCode: (schema) => schema.regex(/^\d{5}(-\d{4})?$/, "Invalid zip code format"),
}).extend({
  items: z.array(insertOrderItemSchema.omit({ orderId: true })).min(1, "At least one order item is required"),
});


export const selectOrderSchema = createSelectSchema(orders);
export const updateOrderSchema = insertOrderSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertOrderType = z.infer<typeof insertOrderSchema>;
export type SelectOrderType = z.infer<typeof selectOrderSchema>;


