import { Request, Response, Router } from "express";
import { sendSuccess } from "../../common/apiResponse";
import { env } from "../../config/env";
import { requireRoles } from "../security/rbac.middleware";
import { observabilityMetrics } from "./observability.metrics";

const router = Router();

router.get("/summary", requireRoles(["ADMIN"]), (_req: Request, res: Response) => {
  const snapshot = observabilityMetrics.getSnapshot(env.SLOW_REQUEST_THRESHOLD_MS);
  return sendSuccess(res, {
    data: snapshot,
    message: "Observability summary"
  });
});

export const observabilityRoutes = router;
