DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
    CREATE TYPE user_role AS ENUM ('ADMIN', 'OPERATOR', 'ACCOUNTANT');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "user_sessions" (
  "session_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "username" varchar(128) NOT NULL,
  "role" user_role NOT NULL,
  "ip_address" varchar(64),
  "user_agent" varchar(512),
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "last_seen_at" timestamp with time zone NOT NULL DEFAULT now(),
  "logout_at" timestamp with time zone,
  "session_duration_ms" integer NOT NULL DEFAULT 0,
  "active" boolean NOT NULL DEFAULT true,
  "metadata" jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS "user_sessions_user_id_idx"
  ON "user_sessions" ("user_id");

CREATE INDEX IF NOT EXISTS "user_sessions_active_idx"
  ON "user_sessions" ("active");

CREATE INDEX IF NOT EXISTS "user_sessions_created_at_idx"
  ON "user_sessions" ("created_at");

CREATE TABLE IF NOT EXISTS "activity_logs" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "session_id" uuid NOT NULL REFERENCES "user_sessions"("session_id") ON DELETE CASCADE,
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "username" varchar(128) NOT NULL,
  "action" varchar(64) NOT NULL,
  "route" varchar(255) NOT NULL,
  "method" varchar(16) NOT NULL,
  "status_code" integer NOT NULL,
  "duration_ms" integer NOT NULL,
  "ip_address" varchar(64),
  "user_agent" varchar(512),
  "details" jsonb NOT NULL DEFAULT '{}'::jsonb,
  "created_at" timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "activity_logs_session_id_idx"
  ON "activity_logs" ("session_id");

CREATE INDEX IF NOT EXISTS "activity_logs_user_id_idx"
  ON "activity_logs" ("user_id");

CREATE INDEX IF NOT EXISTS "activity_logs_route_idx"
  ON "activity_logs" ("route");

CREATE INDEX IF NOT EXISTS "activity_logs_created_at_idx"
  ON "activity_logs" ("created_at");
