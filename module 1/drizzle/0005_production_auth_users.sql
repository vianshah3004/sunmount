CREATE TABLE IF NOT EXISTS "users" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "username" varchar(128) NOT NULL,
  "password_hash" varchar(255) NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "users_username_uniq" ON "users" ("username");
