import { NextFunction, Request, Response } from "express";
import { env } from "../../config/env";
import { logger } from "../../common/logger";
import { AuthenticatedRequest } from "../security/auth.middleware";
import { observabilityMetrics } from "./observability.metrics";
import { auditService } from "../audit/audit.service";
import { authService } from "../auth/auth.service";

const NOISY_PATHS = new Set(["/health", "/metrics"]);
const AUDIT_EXCLUDED_PREFIXES = ["/api/auth", "/auth"];

export const requestObservabilityMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const startedAt = process.hrtime.bigint();

  res.on("finish", () => {
    const durationMs = Number(process.hrtime.bigint() - startedAt) / 1_000_000;
    const routePath = req.route?.path ? String(req.route.path) : req.path;
    const route = req.baseUrl ? `${req.baseUrl}${routePath}` : routePath;

    observabilityMetrics.record(
      {
        method: req.method,
        route,
        statusCode: res.statusCode,
        durationMs
      },
      env.SLOW_REQUEST_THRESHOLD_MS
    );

    if (NOISY_PATHS.has(req.path)) {
      return;
    }

    const authReq = req as AuthenticatedRequest;
    const bearerToken = req.header("authorization")?.startsWith("Bearer ")
      ? req.header("authorization")?.slice("Bearer ".length).trim()
      : undefined;
    let fallbackAuth = null as ReturnType<typeof authService.verifyToken> | null;
    if (!authReq.auth && bearerToken) {
      try {
        fallbackAuth = authService.verifyToken(bearerToken);
      } catch (error) {
        logger.warn("Skipping audit auth fallback after token verification failure", {
          requestId: String(res.locals.requestId ?? "unknown"),
          route,
          error
        });
      }
    }
    const auditAuth = authReq.auth ?? (fallbackAuth
      ? {
          userId: fallbackAuth.sub,
          username: fallbackAuth.username,
          role: fallbackAuth.role,
          sessionId: fallbackAuth.sessionId
        }
      : null);
    const meta = {
      requestId: String(res.locals.requestId ?? "unknown"),
      method: req.method,
      route,
      statusCode: res.statusCode,
      durationMs: Number(durationMs.toFixed(2)),
      userId: auditAuth?.userId ?? null,
      role: auditAuth?.role ?? null,
      ip: req.ip
    };

    if (durationMs >= env.SLOW_REQUEST_THRESHOLD_MS || res.statusCode >= 500) {
      logger.warn("API request completed with elevated risk", meta);
    } else {
      logger.info("API request completed", meta);
    }

    const auth = auditAuth;
    const shouldPersistAudit = Boolean(auth?.sessionId) && !AUDIT_EXCLUDED_PREFIXES.some((prefix) => route.startsWith(prefix));

    if (shouldPersistAudit) {
      void auditService.recordRequest({
        sessionId: auth!.sessionId as string,
        userId: auth!.userId,
        username: auth!.username,
        method: req.method,
        route,
        statusCode: res.statusCode,
        durationMs,
        ipAddress: req.ip,
        userAgent: req.get("user-agent") ?? undefined,
        details: {
          requestId: String(res.locals.requestId ?? "unknown"),
          path: req.path,
          baseUrl: req.baseUrl,
          query: req.query
        }
      }).catch((auditError) => {
        logger.error("Failed to persist audit log", {
          requestId: String(res.locals.requestId ?? "unknown"),
          error: auditError
        });
      });
    }
  });

  next();
};
