import { NextFunction, Request, Response } from "express";
import { sendSuccess } from "../../common/apiResponse";
import { settingsService } from "./settings.service";

export const settingsController = {
  async getSettings(_req: Request, res: Response, next: NextFunction) {
    try {
      const settings = await settingsService.getSettings();
      return sendSuccess(res, { data: settings });
    } catch (error) {
      return next(error);
    }
  },

  async updateSettings(req: Request, res: Response, next: NextFunction) {
    try {
      const updatedSettings = await settingsService.updateSettings(req.body);
      return sendSuccess(res, {
        message: "Settings updated successfully",
        data: updatedSettings
      });
    } catch (error) {
      return next(error);
    }
  },

  async getHealth(_req: Request, res: Response, next: NextFunction) {
    try {
      const health = await settingsService.getHealth();
      return sendSuccess(res, { data: health });
    } catch (error) {
      return next(error);
    }
  }
};
