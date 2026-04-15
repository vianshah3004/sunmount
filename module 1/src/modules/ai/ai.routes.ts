import { Router } from "express";
import { aiController } from "./ai.controller";

const router = Router();

router.get("/reorder/:productId", aiController.getReorderSuggestion);
router.post("/query", aiController.processUserQuery);
router.get("/insights", aiController.generateInsights);

export const aiRoutes = router;
