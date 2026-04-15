import { NextFunction, Request, Response } from "express";
import { z } from "zod";
import { sendSuccess } from "../../common/apiResponse";
import { AppError } from "../../common/errors/AppError";
import { aiService } from "./ai.service";

const queryBodySchema = z.object({
  userQuery: z.string().min(1)
});

const reorderQuerySchema = z.object({
  lookbackDays: z.coerce.number().int().positive().max(365).optional()
});

export const aiController = {
  async getReorderSuggestion(req: Request, res: Response, next: NextFunction) {
    try {
      const productId = String(req.params.productId);
      if (!productId) {
        throw new AppError("productId is required", 400, "VALIDATION_ERROR", {
          field: "productId"
        });
      }

      const query = reorderQuerySchema.parse(req.query);
      const result = await aiService.getReorderSuggestion(productId, query.lookbackDays ?? 30);

      return sendSuccess(res, { data: result });
    } catch (error) {
      return next(error);
    }
  },

  async processUserQuery(req: Request, res: Response, next: NextFunction) {
    try {
      const payload = queryBodySchema.parse(req.body);
      const result = await aiService.processUserQuery(payload.userQuery);
      return sendSuccess(res, { data: result });
    } catch (error) {
      return next(error);
    }
  },

  async generateInsights(_req: Request, res: Response, next: NextFunction) {
    try {
      const result = await aiService.generateInsights();
      return sendSuccess(res, { data: result });
    } catch (error) {
      return next(error);
    }
  }
};
