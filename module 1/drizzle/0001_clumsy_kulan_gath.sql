CREATE TYPE "public"."manufacturing_status" AS ENUM('IN_PROGRESS', 'COMPLETED', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "public"."order_status" AS ENUM('QUOTATION', 'QUOTATION_RECEIVED', 'PACKING', 'DISPATCHED', 'PAID', 'UNPAID', 'COMPLETED', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "public"."order_type" AS ENUM('SALE', 'PURCHASE');--> statement-breakpoint
CREATE TABLE "manufacturing_batches" (
	"batch_number" varchar(64) PRIMARY KEY NOT NULL,
	"raw_materials" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"output_products" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"status" "manufacturing_status" DEFAULT 'IN_PROGRESS' NOT NULL,
	"start_date" timestamp with time zone DEFAULT now() NOT NULL,
	"end_date" timestamp with time zone,
	"material_consumed" boolean DEFAULT false NOT NULL,
	"output_added" boolean DEFAULT false NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"order_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"type" "order_type" NOT NULL,
	"party_id" varchar(128) NOT NULL,
	"products" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"status" "order_status" NOT NULL,
	"order_date" timestamp with time zone DEFAULT now() NOT NULL,
	"notes" text,
	"inventory_applied" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "manufacturing_status_idx" ON "manufacturing_batches" USING btree ("status");--> statement-breakpoint
CREATE INDEX "manufacturing_start_date_idx" ON "manufacturing_batches" USING btree ("start_date");--> statement-breakpoint
CREATE INDEX "manufacturing_end_date_idx" ON "manufacturing_batches" USING btree ("end_date");--> statement-breakpoint
CREATE INDEX "orders_type_idx" ON "orders" USING btree ("type");--> statement-breakpoint
CREATE INDEX "orders_status_idx" ON "orders" USING btree ("status");--> statement-breakpoint
CREATE INDEX "orders_order_date_idx" ON "orders" USING btree ("order_date");--> statement-breakpoint
CREATE INDEX "orders_party_idx" ON "orders" USING btree ("party_id");