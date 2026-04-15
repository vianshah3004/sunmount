CREATE TABLE "history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"entity_type" varchar(32) NOT NULL,
	"entity_id" varchar(128) NOT NULL,
	"action" varchar(32) NOT NULL,
	"summary" text NOT NULL,
	"payload" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "manufacturing_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"batch_number" varchar(64) NOT NULL,
	"product_id" uuid NOT NULL,
	"item_type" varchar(16) NOT NULL,
	"quantity" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "order_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"sku" varchar(64) NOT NULL,
	"quantity" integer NOT NULL,
	"unit_price" numeric(12, 2) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "unit" varchar(16) DEFAULT 'pcs' NOT NULL;--> statement-breakpoint
ALTER TABLE "manufacturing_items" ADD CONSTRAINT "manufacturing_items_batch_number_manufacturing_batches_batch_number_fk" FOREIGN KEY ("batch_number") REFERENCES "public"."manufacturing_batches"("batch_number") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "manufacturing_items" ADD CONSTRAINT "manufacturing_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_orders_order_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("order_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "history_entity_type_idx" ON "history" USING btree ("entity_type");--> statement-breakpoint
CREATE INDEX "history_entity_id_idx" ON "history" USING btree ("entity_id");--> statement-breakpoint
CREATE INDEX "history_created_at_idx" ON "history" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "manufacturing_items_batch_number_idx" ON "manufacturing_items" USING btree ("batch_number");--> statement-breakpoint
CREATE INDEX "manufacturing_items_product_id_idx" ON "manufacturing_items" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "manufacturing_items_type_idx" ON "manufacturing_items" USING btree ("item_type");--> statement-breakpoint
CREATE INDEX "order_items_order_id_idx" ON "order_items" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "order_items_product_id_idx" ON "order_items" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "order_items_sku_idx" ON "order_items" USING btree ("sku");