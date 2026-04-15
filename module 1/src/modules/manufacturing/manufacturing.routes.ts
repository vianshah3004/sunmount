import { Router } from "express";
import { requireRoles } from "../security/rbac.middleware";
import { manufacturingController } from "./manufacturing.controller";

const router = Router();

router.post("/", manufacturingController.create);
router.get("/", manufacturingController.list);
router.post("/start", requireRoles(["OPERATOR", "ADMIN"]), manufacturingController.startByBody);
router.post("/complete", requireRoles(["OPERATOR", "ADMIN"]), manufacturingController.completeByBody);
router.get("/:id", manufacturingController.getById);
router.put("/:id", manufacturingController.update);
router.put("/:id/status", manufacturingController.updateStatus);
router.post("/:id/start", requireRoles(["OPERATOR", "ADMIN"]), manufacturingController.start);
router.post("/:id/complete", requireRoles(["OPERATOR", "ADMIN"]), manufacturingController.complete);
router.delete("/:id", manufacturingController.delete);

export const manufacturingRoutes = router;
