-- Backend/admin customer entry doesn't always have an email or phone on hand
-- yet (e.g. walk-in or phone orders); the public-facing site will still
-- require both, but the admin side needs to allow adding the customer first
-- and filling contact info in later.
ALTER TABLE "customers" ALTER COLUMN "email" DROP NOT NULL;
--> statement-breakpoint
ALTER TABLE "customers" ALTER COLUMN "phone" DROP NOT NULL;
