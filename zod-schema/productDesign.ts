import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { productDesigns } from "@/db/schema";
import { z } from "zod";

export const insertProductDesignSchema = createInsertSchema(productDesigns, {
  name: (schema) => schema.min(1, "Design name is required"),
  price: (schema) => schema.refine((val) => parseFloat(val) > 0, {
    message: "Price must be greater than 0",
  }),
  quantity: (schema) => schema.refine((val) => val >= 0, {
    message: "Quantity cannot be negative",
  }),
});

export const selectProductDesignSchema = createSelectSchema(productDesigns);

export type InsertProductDesignType = z.infer<typeof insertProductDesignSchema>;
export type SelectProductDesignType = z.infer<typeof selectProductDesignSchema>;
