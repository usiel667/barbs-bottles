import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { bottleSizes } from "@/db/schema";
import { z } from "zod";

export const insertBottleSizeSchema = createInsertSchema(bottleSizes, {
  code: (schema) => schema.min(1, "Size code is required"),
  description: (schema) => schema.min(1, "Size description is required"),
});

export const selectBottleSizeSchema = createSelectSchema(bottleSizes);

export type InsertBottleSizeType = z.infer<typeof insertBottleSizeSchema>;
export type SelectBottleSizeType = z.infer<typeof selectBottleSizeSchema>;
