import "dotenv/config";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";
import { logger } from "../common/logger";

declare global {
  var __dbPool__: Pool | undefined;
}

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is missing. Set it in .env");
}

if (!process.env.DATABASE_URL.includes("-pooler")) {
  throw new Error("DATABASE_URL must use Neon pooler host (contains '-pooler')");
}

if (!process.env.DATABASE_URL.includes("sslmode=verify-full")) {
  throw new Error("DATABASE_URL must include sslmode=verify-full for strict TLS verification");
}

if (process.env.DATABASE_URL.includes("channel_binding=")) {
  throw new Error("DATABASE_URL must not include channel_binding parameter");
}

const createPool = () =>
  new Pool({
    connectionString: process.env.DATABASE_URL,
    max: Number(process.env.DB_POOL_MAX ?? 20),
    idleTimeoutMillis: Number(process.env.DB_IDLE_TIMEOUT_MS ?? 60_000),
    connectionTimeoutMillis: Number(process.env.DB_CONNECT_TIMEOUT_MS ?? 30_000),
    keepAlive: true
  });

export const pool = global.__dbPool__ ?? createPool();

if (process.env.NODE_ENV !== "production") {
  global.__dbPool__ = pool;
}

export const db = drizzle(pool, { schema });

export const verifyDatabaseConnection = async () => {
  try {
    await pool.query("SELECT 1");
    logger.info("Database connected successfully");
  } catch (error) {
    logger.error("Database connection failed", { error });
    throw error;
  }
};
