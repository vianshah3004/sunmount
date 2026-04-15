import { Router } from "express";
import { historyController } from "./history.controller";

const router = Router();

router.get("/", historyController.list);
router.get("/export/csv", historyController.exportCsv);
router.get("/export/pdf", historyController.exportPdf);

export const historyRoutes = router;
