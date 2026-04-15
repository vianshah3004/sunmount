import { Router } from "express";
import { omsController } from "./oms.controller";

const router = Router();

router.post("/", omsController.create);
router.get("/", omsController.list);
router.get("/:id", omsController.getById);
router.put("/:id/items", omsController.updateItems);
router.put("/:id/status", omsController.transitionStatus);

export const omsRoutes = router;
