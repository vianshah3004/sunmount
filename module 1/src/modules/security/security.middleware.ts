import cors from "cors";
import express from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import { env } from "../../config/env";

const resolveOrigins = () => {
  if (env.CORS_ORIGIN === "*") {
    return "*";
  }

  return env.CORS_ORIGIN.split(",")
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0);
};

export const securityMiddleware = [
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }
  }),
  cors({
    origin: resolveOrigins(),
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"]
  }),
  rateLimit({
    windowMs: env.RATE_LIMIT_WINDOW_MS,
    max: env.RATE_LIMIT_MAX,
    standardHeaders: true,
    legacyHeaders: false
  }),
  express.json({ limit: "1mb" })
];
