import { Router } from "express";
import { transitionLogsController } from "./transitionLogs.controller";

const router = Router();

router.get("/", transitionLogsController.list);

export const transitionLogsRoutes = router;