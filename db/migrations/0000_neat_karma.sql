CREATE TYPE "public"."order_status" AS ENUM('pending', 'design', 'production', 'quality_check', 'shipped', 'delivered', 'canceled');--> statement-breakpoint
CREATE TYPE "public"."bottle_material" AS ENUM('stainless_steel', 'plastic', 'glass', 'aluminum');--> statement-breakpoint
CREATE TYPE "public"."bottle_size" AS ENUM('12oz', '16oz', '20oz', '24oz', '32oz');--> statement-breakpoint
CREATE TABLE "customers" (
	"id" serial PRIMARY KEY NOT NULL,
	"first_name" varchar(255) NOT NULL,
	"last_name" varchar(255) NOT NULL,
	"email" varchar(255) NOT NULL,
	"phone" varchar(20) NOT NULL,
	"address1" varchar(255) NOT NULL,
	"address2" varchar(255),
	"city" varchar(100) NOT NULL,
	"state" varchar(2) NOT NULL,
	"zip_code" varchar(10) NOT NULL,
	"notes" text,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "customers_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" serial PRIMARY KEY NOT NULL,
	"customer_id" integer NOT NULL,
	"product_id" integer NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	"selected_color" varchar(50) NOT NULL,
	"custom_design_text" text,
	"custom_logo_url" text,
	"design_notes" text,
	"design_proof_url" text,
	"status" "order_status" DEFAULT 'pending' NOT NULL,
	"total_price" numeric(10, 2) NOT NULL,
	"estimated_delivery" timestamp,
	"assigned_to" varchar(255) DEFAULT 'unassigned',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"size" "bottle_size" NOT NULL,
	"material" "bottle_material" NOT NULL,
	"base_price" numeric(10, 2) NOT NULL,
	"colors" text NOT NULL,
	"features" text,
	"design_template" text,
	"design_preview" text,
	"design_variations" text,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;