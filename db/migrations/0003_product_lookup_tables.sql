CREATE TABLE "bottle_sizes" (
  "id" serial PRIMARY KEY NOT NULL,
  "code" varchar(20) NOT NULL UNIQUE,
  "description" varchar(100) NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint

CREATE TABLE "product_series" (
  "id" serial PRIMARY KEY NOT NULL,
  "name" varchar(100) NOT NULL UNIQUE,
  "created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint

-- Seed bottle_sizes from the previous bottleSizeEnum values
INSERT INTO "bottle_sizes" ("code", "description") VALUES
  ('6.7oz', '6.7 oz (Mini)'),
  ('15oz', '15 oz'),
  ('20oz', '20 oz (Tumbler)'),
  ('24oz', '24 oz'),
  ('36oz', '36 oz'),
  ('46oz', '46 oz'),
  ('64oz', '64 oz (Half Gallon)'),
  ('128oz', '128 oz (Gallon)')
ON CONFLICT ("code") DO NOTHING;
--> statement-breakpoint

-- Seed product_series from the previous ProductConstants.ProductSeries list
INSERT INTO "product_series" ("name") VALUES
  ('Limitless Ultra v8'),
  ('Limitless Gallon'),
  ('Tumbler v2'),
  ('Mini'),
  ('Universal'),
  ('First Responder')
ON CONFLICT ("name") DO NOTHING;
--> statement-breakpoint

-- Backfill product_series with any distinct existing products.series values
-- not already covered by the seed list above (defensive: series was free text)
INSERT INTO "product_series" ("name")
SELECT DISTINCT "series" FROM "products"
ON CONFLICT ("name") DO NOTHING;
--> statement-breakpoint

ALTER TABLE "products" ADD COLUMN "series_id" integer;
--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "size_id" integer;
--> statement-breakpoint

-- Backfill the new FK columns from the old series text / size enum columns
UPDATE "products" p
SET "series_id" = ps."id"
FROM "product_series" ps
WHERE ps."name" = p."series";
--> statement-breakpoint

UPDATE "products" p
SET "size_id" = bs."id"
FROM "bottle_sizes" bs
WHERE bs."code" = p."size"::text;
--> statement-breakpoint

ALTER TABLE "products" ALTER COLUMN "series_id" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "products" ALTER COLUMN "size_id" SET NOT NULL;
--> statement-breakpoint

ALTER TABLE "products" ADD CONSTRAINT "products_series_id_product_series_id_fk"
  FOREIGN KEY ("series_id") REFERENCES "public"."product_series"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_size_id_bottle_sizes_id_fk"
  FOREIGN KEY ("size_id") REFERENCES "public"."bottle_sizes"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint

ALTER TABLE "products" DROP COLUMN "series";
--> statement-breakpoint
ALTER TABLE "products" DROP COLUMN "size";
--> statement-breakpoint

DROP TYPE "public"."bottle_size";
