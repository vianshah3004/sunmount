import { Router } from "express";
import { ordersController } from "./orders.controller";

const router = Router();

router.post("/", ordersController.create);
router.get("/", ordersController.list);
router.get("/:id", ordersController.getById);
router.put("/:id", ordersController.updateStatus);
router.delete("/:id", ordersController.delete);

export const ordersRoutes = router;
