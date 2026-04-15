import { NextFunction, Request, Response } from "express";
import { sendSuccess } from "../../common/apiResponse";
import { dashboardService } from "./dashboard.service";

export const dashboardController = {
  async summary(_req: Request, res: Response, next: NextFunction) {
    try {
      const data = await dashboardService.getSummary();
      return sendSuccess(res, { data });
    } catch (error) {
      return next(error);
    }
  }
};
