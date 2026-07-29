import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { productSeries } from "@/db/schema";
import { z } from "zod";

export const insertProductSeriesSchema = createInsertSchema(productSeries, {
  name: (schema) => schema.min(1, "Series name is required"),
});

export const selectProductSeriesSchema = createSelectSchema(productSeries);

export type InsertProductSeriesType = z.infer<typeof insertProductSeriesSchema>;
export type SelectProductSeriesType = z.infer<typeof selectProductSeriesSchema>;
