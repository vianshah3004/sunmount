CREATE TABLE "settings" (
	"id" integer PRIMARY KEY NOT NULL,
	"organization" varchar(255) NOT NULL,
	"primary_contact_email" varchar(255) NOT NULL,
	"currency" varchar(8) DEFAULT 'INR' NOT NULL,
	"timezone" varchar(64) DEFAULT 'Asia/Kolkata' NOT NULL,
	"notifications_enabled" boolean DEFAULT true NOT NULL,
	"security_flags" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"sync" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "order_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"action" varchar(64) NOT NULL,
	"actor" varchar(128) DEFAULT 'system' NOT NULL,
	"remarks" text,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "order_events" ADD CONSTRAINT "order_events_order_id_erp_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."erp_orders"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "order_events_order_id_idx" ON "order_events" USING btree ("order_id");
--> statement-breakpoint
CREATE INDEX "order_events_action_idx" ON "order_events" USING btree ("action");
--> statement-breakpoint
CREATE INDEX "order_events_created_at_idx" ON "order_events" USING btree ("created_at");