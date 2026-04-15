import "dotenv/config";
import { z } from "zod";

const boolSchema = z
  .string()
  .optional()
  .transform((value) => {
    if (!value) {
      return false;
    }
    return ["true", "1", "yes", "on"].includes(value.toLowerCase());
  });

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(4000),
  DATABASE_URL: z.string().min(1),
  GROQ_API_KEY: z.string().optional(),
  GROQ_MODEL: z.string().default("llama-3.3-70b-versatile"),
  JWT_SECRET: z.string().min(32).default("dev-only-secret-change-me-dev-only-secret"),
  JWT_EXPIRES_IN: z.string().default("12h"),
  AUTH_ENABLED: boolSchema,
  SHARED_USERNAME: z.string().min(3).optional(),
  SHARED_PASSWORD: z.string().min(8).optional(),
  ENCRYPTION_KEY: z.string().min(32).default("dev-only-encryption-key-change-me-32bytes"),
  CORS_ORIGIN: z.string().default("*"),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(60000),
  RATE_LIMIT_MAX: z.coerce.number().int().positive().default(300),
  LOG_LEVEL: z.enum(["info", "warn", "error"]).default("info"),
  METRICS_ENABLED: boolSchema,
  METRICS_AUTH_TOKEN: z.string().optional(),
  SLOW_REQUEST_THRESHOLD_MS: z.coerce.number().int().positive().default(800),
  DB_POOL_MAX: z.coerce.number().int().positive().default(20),
  DB_CONNECT_TIMEOUT_MS: z.coerce.number().int().positive().default(20000),
  DB_IDLE_TIMEOUT_MS: z.coerce.number().int().positive().default(45000)
});

type Env = z.infer<typeof envSchema>;

const parsed = envSchema.parse(process.env) as Env;

if (parsed.NODE_ENV === "production") {
  if (!parsed.AUTH_ENABLED) {
    throw new Error("AUTH_ENABLED must be true in production");
  }

  if (!parsed.SHARED_USERNAME || !parsed.SHARED_PASSWORD) {
    throw new Error("SHARED_USERNAME and SHARED_PASSWORD must be set in production");
  }

  if (parsed.CORS_ORIGIN === "*") {
    throw new Error("CORS_ORIGIN must be restricted in production");
  }
}

export const env = parsed;
export const isAuthEnabled = parsed.AUTH_ENABLED;
