import { Router } from "express";
import { z } from "zod";
import { sendSuccess } from "../../common/apiResponse";
import { inventoryService } from "./inventory.service";

const router = Router();

const inventoryUpdateSchema = z.object({
  productCode: z.string().min(1),
  type: z.enum(["SALE", "PURCHASE", "WIP_RAW", "WIP_OUTPUT"]),
  quantity: z.number().int().positive(),
  referenceId: z.string().min(1).optional()
});

router.post("/update", async (req, res, next) => {
  try {
    const payload = inventoryUpdateSchema.parse(req.body);
    const result = await inventoryService.updateInventory(payload);
    return sendSuccess(res, {
      message: "Inventory updated",
      data: result
    });
  } catch (error) {
    return next(error);
  }
});

export const inventoryRoutes = router;
