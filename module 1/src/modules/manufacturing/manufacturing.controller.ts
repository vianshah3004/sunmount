import { NextFunction, Request, Response } from "express";
import { z } from "zod";
import { sendSuccess } from "../../common/apiResponse";
import { logger } from "../../common/logger";
import { AuthenticatedRequest } from "../security/auth.middleware";
import { manufacturingService } from "./manufacturing.service";

const itemSchema = z.object({
  productCode: z.string().min(1),
  quantity: z.number().int().positive()
});

const createBatchSchema = z.object({
  batchNumber: z.string().min(1),
  rawMaterials: z.array(itemSchema).min(1),
  outputProducts: z.array(itemSchema).min(1),
  status: z.enum(["IN_PROGRESS", "COMPLETED", "CANCELLED"]).optional(),
  notes: z.string().optional()
});

const listQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(200).default(20),
  status: z.enum(["IN_PROGRESS", "COMPLETED", "CANCELLED"]).optional()
});

const updateStatusSchema = z.object({
  status: z.enum(["IN_PROGRESS", "COMPLETED", "CANCELLED"])
});

const updateBatchSchema = z.object({
  rawMaterials: z.array(itemSchema).optional(),
  outputProducts: z.array(itemSchema).optional(),
  notes: z.string().optional()
});

const lifecycleBodySchema = z.object({
  orderId: z.string().min(1).optional(),
  batchId: z.string().min(1).optional()
}).refine((value) => Boolean(value.orderId || value.batchId), {
  message: "orderId or batchId is required"
});

export const manufacturingController = {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const payload = createBatchSchema.parse(req.body);
      const batch = await manufacturingService.createBatch(payload);
      return sendSuccess(res, {
        status: 201,
        message: "Manufacturing batch created",
        data: batch
      });
    } catch (error) {
      return next(error);
    }
  },

  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const query = listQuerySchema.parse(req.query);
      const response = await manufacturingService.listBatches(query.page, query.pageSize, query.status);
      return sendSuccess(res, {
        data: response.data,
        pagination: {
          page: response.page,
          limit: response.pageSize,
          total: response.total
        }
      });
    } catch (error) {
      return next(error);
    }
  },

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const batch = await manufacturingService.getBatchById(String(req.params.id));
      return sendSuccess(res, { data: batch });
    } catch (error) {
      return next(error);
    }
  },

  async start(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as AuthenticatedRequest;
      const idempotencyKey = req.header("Idempotency-Key")?.trim();
      const batchId = String(req.params.id);
      logger.info("Manufacturing start requested", {
        batchId,
        userId: authReq.auth?.userId,
        requestId: res.locals.requestId
      });

      const batch = await manufacturingService.startWIP(batchId, {
        performedBy: authReq.auth?.userId,
        idempotencyKey,
        requestId: String(res.locals.requestId ?? "unknown")
      });
      return sendSuccess(res, {
        message: "Manufacturing batch started",
        data: batch
      });
    } catch (error) {
      return next(error);
    }
  },

  async complete(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as AuthenticatedRequest;
      const idempotencyKey = req.header("Idempotency-Key")?.trim();
      const batchId = String(req.params.id);
      logger.info("Manufacturing completion requested", {
        batchId,
        userId: authReq.auth?.userId,
        requestId: res.locals.requestId
      });

      const batch = await manufacturingService.completeProduction(batchId, {
        performedBy: authReq.auth?.userId,
        idempotencyKey,
        requestId: String(res.locals.requestId ?? "unknown")
      });
      return sendSuccess(res, {
        message: "Manufacturing batch completed",
        data: batch
      });
    } catch (error) {
      return next(error);
    }
  },

  async startByBody(req: Request, res: Response, next: NextFunction) {
    try {
      const payload = lifecycleBodySchema.parse(req.body);
      const authReq = req as AuthenticatedRequest;
      const idempotencyKey = req.header("Idempotency-Key")?.trim();
      const batchId = payload.orderId ?? payload.batchId ?? "";
      const batch = await manufacturingService.startWIP(batchId, {
        performedBy: authReq.auth?.userId,
        idempotencyKey,
        requestId: String(res.locals.requestId ?? "unknown")
      });

      return sendSuccess(res, {
        message: "Manufacturing batch started",
        data: batch
      });
    } catch (error) {
      return next(error);
    }
  },

  async completeByBody(req: Request, res: Response, next: NextFunction) {
    try {
      const payload = lifecycleBodySchema.parse(req.body);
      const authReq = req as AuthenticatedRequest;
      const idempotencyKey = req.header("Idempotency-Key")?.trim();
      const batchId = payload.orderId ?? payload.batchId ?? "";
      const batch = await manufacturingService.completeProduction(batchId, {
        performedBy: authReq.auth?.userId,
        idempotencyKey,
        requestId: String(res.locals.requestId ?? "unknown")
      });

      return sendSuccess(res, {
        message: "Manufacturing batch completed",
        data: batch
      });
    } catch (error) {
      return next(error);
    }
  },

  async updateStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const payload = updateStatusSchema.parse(req.body);
      const batch = await manufacturingService.updateStatus(String(req.params.id), payload.status);
      return sendSuccess(res, {
        message: "Manufacturing status updated",
        data: batch
      });
    } catch (error) {
      return next(error);
    }
  },

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const payload = updateBatchSchema.parse(req.body);
      const batch = await manufacturingService.updateBatch(String(req.params.id), payload);
      return sendSuccess(res, {
        message: "Manufacturing batch updated",
        data: batch
      });
    } catch (error) {
      return next(error);
    }
  },

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await manufacturingService.deleteBatch(String(req.params.id));
      return sendSuccess(res, {
        message: "Manufacturing batch deleted",
        data: result
      });
    } catch (error) {
      return next(error);
    }
  }
};
