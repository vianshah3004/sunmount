import { NextFunction, Request, Response } from "express";
import { z } from "zod";
import { sendSuccess } from "../../common/apiResponse";
import { transitionLogsService } from "./transitionLogs.service";

const listSchema = z.object({
  entityType: z.enum(["manufacturing", "sales", "purchase"]).optional(),
  entityId: z.string().min(1).optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(200).default(20)
});

export const transitionLogsController = {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const query = listSchema.parse(req.query);
      const response = await transitionLogsService.list(query);
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
  }
};