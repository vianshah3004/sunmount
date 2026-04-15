import { Router } from "express";
import { lookupController } from "./lookup.controller";

const router = Router();

router.get("/products", lookupController.products);
router.get("/customers", lookupController.customers);
router.get("/suppliers", lookupController.suppliers);

export const lookupRoutes = router;
