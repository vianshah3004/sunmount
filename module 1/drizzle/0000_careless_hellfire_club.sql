CREATE TYPE "public"."inventory_change_type" AS ENUM('SALE', 'PURCHASE', 'WIP_RAW', 'WIP_OUTPUT');--> statement-breakpoint
CREATE TABLE "inventory_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid NOT NULL,
	"change_type" "inventory_change_type" NOT NULL,
	"quantity" integer NOT NULL,
	"reference_id" varchar(128),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_code" varchar(64) NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"weight" numeric(12, 3),
	"price" numeric(12, 2) NOT NULL,
	"quantity" integer DEFAULT 0 NOT NULL,
	"low_stock_threshold" integer DEFAULT 10 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "inventory_logs" ADD CONSTRAINT "inventory_logs_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "inventory_logs_product_id_idx" ON "inventory_logs" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "inventory_logs_created_at_idx" ON "inventory_logs" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "products_product_code_uniq" ON "products" USING btree ("product_code");--> statement-breakpoint
CREATE INDEX "products_quantity_idx" ON "products" USING btree ("quantity");