import { createServer } from "http";
import { initSocket } from "./common/socket";
import { logger } from "./common/logger";
import { env } from "./config/env";
import { pool, verifyDatabaseConnection } from "./db";
import { app } from "./app";
import { authService } from "./modules/auth/auth.service";
import { registerInventoryEventHandlers } from "./modules/inventory/inventory.events";

const port = env.PORT;

const httpServer = createServer(app);

initSocket(httpServer);
registerInventoryEventHandlers();

const bootstrap = async () => {
  try {
    await verifyDatabaseConnection();
    await authService.ensureSharedUser();

    httpServer.listen(port, () => {
      logger.info(`Inventory service is running on port ${port}`);
    });
  } catch (error) {
    logger.error("Server startup aborted due to database error", { error });
    process.exit(1);
  }
};

void bootstrap();

const shutdown = async (signal: string) => {
  logger.info(`Received ${signal}. Shutting down gracefully...`);

  httpServer.close(async () => {
    await pool.end();
    logger.info("Shutdown completed");
    process.exit(0);
  });
};

process.on("SIGINT", () => {
  void shutdown("SIGINT");
});

process.on("SIGTERM", () => {
  void shutdown("SIGTERM");
});
