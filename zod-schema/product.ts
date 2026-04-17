import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { products } from "@/db/schema";
import { z } from "zod";

export const insertProductSchema = createInsertSchema(products, {
  name: (schema) => schema.min(1, "Product name is required"),
  basePrice: (schema) => schema.refine((val) => parseFloat(val) > 0, {
    message: "Base price must be greater than 0",
  }),
  colors: (schema) => schema.min(1, "At least one color must be specified"),

})

export const selectProductSchema = createSelectSchema(products);

export type InsertProductType = z.infer<typeof insertProductSchema>;
export type SelectProductType = z.infer<typeof selectProductSchema>;


