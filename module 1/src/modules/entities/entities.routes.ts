import { Router } from "express";
import { entitiesController } from "./entities.controller";

const router = Router();

router.post("/entities", entitiesController.createEntity);
router.get("/entities", entitiesController.getEntities);
router.get("/entities/lookup/:entityCode", entitiesController.lookupEntity);
router.get("/entities/:id", entitiesController.getEntityById);
router.patch("/entities/:id", entitiesController.updateEntity);
router.delete("/entities/:id", entitiesController.deleteEntity);
router.get("/customers/:customerId", entitiesController.getCustomerByCode);
router.get("/suppliers/:supplierId", entitiesController.getSupplierByCode);
router.post("/orders/from-entity/:id", entitiesController.createOrderFromEntity);

export const entitiesRoutes = router;
