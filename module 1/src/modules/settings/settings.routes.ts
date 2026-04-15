import { Router } from "express";
import { settingsController } from "./settings.controller";

const router = Router();

router.get("/", settingsController.getSettings);
router.put("/", settingsController.updateSettings);
router.get("/health", settingsController.getHealth);

export const settingsRoutes = router;
