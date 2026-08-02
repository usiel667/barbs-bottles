--> statement-breakpoint
CREATE TABLE "order_items" (
  "id" serial PRIMARY KEY NOT NULL,
  "order_id" integer NOT NULL,
  "product_id" integer NOT NULL,
  "quantity" integer DEFAULT 1 NOT NULL,
  "selected_color" varchar(50) NOT NULL,
  "unit_price" numeric(10, 2) NOT NULL,
  "discount" numeric(5, 2) DEFAULT '0'
);
--> statement-breakpoint

-- Migrate existing single-item orders into order_items before dropping columns
-- NULLIF guards against any legacy rows with quantity = 0 (would cause divide-by-zero)
INSERT INTO "order_items" ("order_id", "product_id", "quantity", "selected_color", "unit_price")
SELECT id, product_id, quantity, selected_color, total_price / NULLIF(quantity, 0)
FROM "orders";
--> statement-breakpoint

ALTER TABLE "orders" DROP COLUMN "product_id";
--> statement-breakpoint
ALTER TABLE "orders" DROP COLUMN "quantity";
--> statement-breakpoint
ALTER TABLE "orders" DROP COLUMN "selected_color";
--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_orders_id_fk"
  FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_product_id_products_id_fk"
  FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;
