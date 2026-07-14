import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { products } from "@/db/schema";
import { z } from "zod";

export const insertProductSchema = createInsertSchema(products, {
  name: (schema) => schema.min(1, "Product name is required"),
  series: (schema) => schema.min(1, "Series is required"),
});

export const selectProductSchema = createSelectSchema(products);

export const productSchema = insertProductSchema.partial();

export type InsertProductType = z.infer<typeof insertProductSchema>;
export type SelectProductType = z.infer<typeof selectProductSchema>;

export const updateProductSchema = insertProductSchema.omit({
  createdAt: true,
  updatedAt: true,
});
export type updateProductType = z.infer<typeof updateProductSchema>;
