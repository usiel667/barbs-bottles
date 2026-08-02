-- Replaces the single shipping_address text column (added in 0005, never
-- populated) with structured fields mirroring customers.address1/address2/
-- city/state/zipCode, so the order form's shipping address can use the same
-- layout as the customer edit form.
ALTER TABLE "orders" DROP COLUMN "shipping_address";
--> statement-breakpoint

ALTER TABLE "orders" ADD COLUMN "shipping_address1" varchar(255);
--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "shipping_address2" varchar(255);
--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "shipping_city" varchar(100);
--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "shipping_state" varchar(2);
--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "shipping_zip_code" varchar(10);
--> statement-breakpoint

-- Backfill existing orders from their customer's address (best available
-- default for orders placed before this feature existed)
UPDATE "orders" o
SET
  "shipping_address1" = c."address1",
  "shipping_address2" = c."address2",
  "shipping_city" = c."city",
  "shipping_state" = c."state",
  "shipping_zip_code" = c."zip_code"
FROM "customers" c
WHERE c."id" = o."customer_id";
--> statement-breakpoint

ALTER TABLE "orders" ALTER COLUMN "shipping_address1" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "orders" ALTER COLUMN "shipping_city" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "orders" ALTER COLUMN "shipping_state" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "orders" ALTER COLUMN "shipping_zip_code" SET NOT NULL;
