DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
    CREATE TYPE user_role AS ENUM ('ADMIN', 'OPERATOR', 'ACCOUNTANT');
  END IF;
END $$;

ALTER TABLE "users"
  ADD COLUMN IF NOT EXISTS "role" user_role NOT NULL DEFAULT 'OPERATOR';

CREATE TABLE IF NOT EXISTS "transition_logs" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "entity_type" varchar(32) NOT NULL,
  "entity_id" varchar(128) NOT NULL,
  "previous_state" varchar(64) NOT NULL,
  "new_state" varchar(64) NOT NULL,
  "performed_by" varchar(128) NOT NULL DEFAULT 'system',
  "action" varchar(64) NOT NULL,
  "idempotency_key" varchar(128),
  "metadata" jsonb NOT NULL DEFAULT '{}'::jsonb,
  "created_at" timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "transition_logs_entity_idx"
  ON "transition_logs" ("entity_type", "entity_id");

CREATE INDEX IF NOT EXISTS "transition_logs_created_at_idx"
  ON "transition_logs" ("created_at");

CREATE INDEX IF NOT EXISTS "transition_logs_state_idx"
  ON "transition_logs" ("new_state");

CREATE UNIQUE INDEX IF NOT EXISTS "transition_logs_idempotency_uniq"
  ON "transition_logs" ("entity_type", "entity_id", "action", "idempotency_key");