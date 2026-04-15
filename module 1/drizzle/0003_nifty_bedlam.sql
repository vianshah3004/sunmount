CREATE TYPE "public"."erp_order_status" AS ENUM('DRAFT', 'QUOTATION', 'APPROVED', 'PACKING', 'DISPATCHED', 'COMPLETED', 'ON_HOLD', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "public"."erp_payment_status" AS ENUM('UNPAID', 'PARTIALLY_PAID', 'PAID', 'REFUNDED');--> statement-breakpoint
CREATE TABLE "addresses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"label" varchar(64),
	"line1" varchar(255) NOT NULL,
	"line2" varchar(255),
	"city" varchar(128) NOT NULL,
	"state" varchar(128),
	"country" varchar(128) DEFAULT 'India' NOT NULL,
	"postal_code" varchar(32),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "attachments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid,
	"file_name" varchar(255) NOT NULL,
	"file_type" varchar(128),
	"storage_path" varchar(512) NOT NULL,
	"uploaded_by" varchar(128),
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "customers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"customer_code" varchar(64) NOT NULL,
	"name" varchar(255) NOT NULL,
	"email" varchar(255),
	"phone" varchar(32),
	"tax_id" varchar(64),
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "erp_order_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"action" varchar(64) NOT NULL,
	"actor" varchar(128) DEFAULT 'system' NOT NULL,
	"remarks" text,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "erp_order_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"line_number" integer NOT NULL,
	"product_id" uuid NOT NULL,
	"sku" varchar(64) NOT NULL,
	"name" varchar(255) NOT NULL,
	"quantity" integer NOT NULL,
	"unit_price" numeric(14, 2) NOT NULL,
	"discount_amount" numeric(14, 2) DEFAULT '0' NOT NULL,
	"tax_rate" numeric(6, 3) DEFAULT '0' NOT NULL,
	"tax_amount" numeric(14, 2) DEFAULT '0' NOT NULL,
	"line_total" numeric(14, 2) NOT NULL,
	"dispatched_qty" integer DEFAULT 0 NOT NULL,
	"received_qty" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "erp_orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_number" varchar(64) NOT NULL,
	"type" "order_type" NOT NULL,
	"customer_id" uuid,
	"supplier_id" uuid,
	"address_id" uuid,
	"status" "erp_order_status" DEFAULT 'DRAFT' NOT NULL,
	"payment_status" "erp_payment_status" DEFAULT 'UNPAID' NOT NULL,
	"subtotal_amount" numeric(14, 2) DEFAULT '0' NOT NULL,
	"discount_amount" numeric(14, 2) DEFAULT '0' NOT NULL,
	"freight_charges" numeric(14, 2) DEFAULT '0' NOT NULL,
	"packing_charges" numeric(14, 2) DEFAULT '0' NOT NULL,
	"tax_amount" numeric(14, 2) DEFAULT '0' NOT NULL,
	"grand_total" numeric(14, 2) DEFAULT '0' NOT NULL,
	"currency" varchar(8) DEFAULT 'INR' NOT NULL,
	"delivery_date" timestamp with time zone,
	"payment_terms" varchar(128),
	"owner" varchar(128),
	"notes" text,
	"version" integer DEFAULT 1 NOT NULL,
	"is_draft" boolean DEFAULT true NOT NULL,
	"idempotency_key" varchar(128),
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "suppliers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"supplier_code" varchar(64) NOT NULL,
	"name" varchar(255) NOT NULL,
	"email" varchar(255),
	"phone" varchar(32),
	"tax_id" varchar(64),
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "attachments" ADD CONSTRAINT "attachments_order_id_erp_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."erp_orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "erp_order_events" ADD CONSTRAINT "erp_order_events_order_id_erp_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."erp_orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "erp_order_items" ADD CONSTRAINT "erp_order_items_order_id_erp_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."erp_orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "erp_order_items" ADD CONSTRAINT "erp_order_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "erp_orders" ADD CONSTRAINT "erp_orders_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "erp_orders" ADD CONSTRAINT "erp_orders_supplier_id_suppliers_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "erp_orders" ADD CONSTRAINT "erp_orders_address_id_addresses_id_fk" FOREIGN KEY ("address_id") REFERENCES "public"."addresses"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "addresses_city_idx" ON "addresses" USING btree ("city");--> statement-breakpoint
CREATE INDEX "addresses_postal_idx" ON "addresses" USING btree ("postal_code");--> statement-breakpoint
CREATE INDEX "attachments_order_id_idx" ON "attachments" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "attachments_uploaded_by_idx" ON "attachments" USING btree ("uploaded_by");--> statement-breakpoint
CREATE UNIQUE INDEX "customers_customer_code_uniq" ON "customers" USING btree ("customer_code");--> statement-breakpoint
CREATE INDEX "customers_name_idx" ON "customers" USING btree ("name");--> statement-breakpoint
CREATE INDEX "erp_order_events_order_id_idx" ON "erp_order_events" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "erp_order_events_action_idx" ON "erp_order_events" USING btree ("action");--> statement-breakpoint
CREATE INDEX "erp_order_events_created_at_idx" ON "erp_order_events" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "erp_order_items_order_id_idx" ON "erp_order_items" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "erp_order_items_product_id_idx" ON "erp_order_items" USING btree ("product_id");--> statement-breakpoint
CREATE UNIQUE INDEX "erp_order_items_order_line_uniq" ON "erp_order_items" USING btree ("order_id","line_number");--> statement-breakpoint
CREATE UNIQUE INDEX "erp_orders_order_number_uniq" ON "erp_orders" USING btree ("order_number");--> statement-breakpoint
CREATE UNIQUE INDEX "erp_orders_idempotency_key_uniq" ON "erp_orders" USING btree ("idempotency_key");--> statement-breakpoint
CREATE INDEX "erp_orders_type_idx" ON "erp_orders" USING btree ("type");--> statement-breakpoint
CREATE INDEX "erp_orders_status_idx" ON "erp_orders" USING btree ("status");--> statement-breakpoint
CREATE INDEX "erp_orders_payment_status_idx" ON "erp_orders" USING btree ("payment_status");--> statement-breakpoint
CREATE INDEX "erp_orders_created_at_idx" ON "erp_orders" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "suppliers_supplier_code_uniq" ON "suppliers" USING btree ("supplier_code");--> statement-breakpoint
CREATE INDEX "suppliers_name_idx" ON "suppliers" USING btree ("name");