import "dotenv/config";
import { randomUUID } from "node:crypto";
import express from "express";
import { apiAdapterRoutes } from "./apiAdapterRoutes";
import { sendSuccess } from "./common/apiResponse";
import { errorHandler } from "./common/errors/errorHandler";
import { authRoutes } from "./modules/auth/auth.routes";
import { aiRoutes } from "./modules/ai/ai.routes";
import { dashboardRoutes } from "./modules/dashboard/dashboard.routes";
import { historyRoutes } from "./modules/history/history.routes";
import { entitiesRoutes } from "./modules/entities/entities.routes";
import { inventoryRoutes } from "./modules/inventory/inventory.routes";
import { lookupRoutes } from "./modules/lookup/lookup.routes";
import { manufacturingRoutes } from "./modules/manufacturing/manufacturing.routes";
import { omsRoutes } from "./modules/oms/oms.routes";
import { ordersRoutes } from "./modules/orders/orders.routes";
import { settingsRoutes } from "./modules/settings/settings.routes";
import { productRoutes } from "./modules/product/product.routes";
import { requireAuth } from "./modules/security/auth.middleware";
import { securityMiddleware } from "./modules/security/security.middleware";
import { transitionLogsRoutes } from "./modules/transitionLogs/transitionLogs.routes";
import { env } from "./config/env";
import { observabilityRoutes } from "./modules/observability/observability.routes";
import { requestObservabilityMiddleware } from "./modules/observability/observability.middleware";
import { observabilityMetrics } from "./modules/observability/observability.metrics";

export const app = express();

for (const middleware of securityMiddleware) {
  app.use(middleware);
}

app.use((req, res, next) => {
  const requestId = randomUUID();
  res.locals.requestId = requestId;
  req.headers["x-request-id"] = requestId;
  res.setHeader("x-request-id", requestId);
  next();
});

app.get("/health", (_req, res) => {
  return sendSuccess(res, {
    data: {
      status: "ok",
      timestamp: new Date().toISOString()
    },
    message: "Service is healthy"
  });
});

if (env.METRICS_ENABLED) {
  app.get("/metrics", (req, res) => {
    if (env.METRICS_AUTH_TOKEN) {
      const provided = req.header("x-metrics-token")?.trim();
      if (!provided || provided !== env.METRICS_AUTH_TOKEN) {
        return res.status(401).type("text/plain").send("unauthorized\n");
      }
    }

    return res
      .status(200)
      .type("text/plain")
      .send(observabilityMetrics.toPrometheus(env.SLOW_REQUEST_THRESHOLD_MS));
  });
}

app.use(requestObservabilityMiddleware);

app.use("/auth", authRoutes);
app.use("/api/auth", authRoutes);

app.use(requireAuth);

app.use("/products", productRoutes);
app.use("/inventory", inventoryRoutes);
app.use("/ai", aiRoutes);
app.use("/settings", settingsRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/entities", entitiesRoutes);
app.use("/api", entitiesRoutes);
app.use("/orders/v2", omsRoutes);
app.use("/orders", ordersRoutes);
app.use("/manufacturing", manufacturingRoutes);
app.use("/history", historyRoutes);
app.use("/dashboard", dashboardRoutes);
app.use("/lookup", lookupRoutes);
app.use("/transition-logs", transitionLogsRoutes);
app.use("/api/transition-logs", transitionLogsRoutes);
app.use("/observability", observabilityRoutes);
app.use("/api/observability", observabilityRoutes);
app.use("/api", apiAdapterRoutes);

app.use(errorHandler);
