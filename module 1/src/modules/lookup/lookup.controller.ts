import { NextFunction, Request, Response } from "express";
import { sendSuccess } from "../../common/apiResponse";
import { lookupService } from "./lookup.service";

const getQuery = (req: Request) => String(req.query.q ?? "").trim();

export const lookupController = {
  async products(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await lookupService.products(getQuery(req));
      return sendSuccess(res, { data });
    } catch (error) {
      return next(error);
    }
  },

  async customers(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await lookupService.parties("SALE", getQuery(req));
      return sendSuccess(res, { data });
    } catch (error) {
      return next(error);
    }
  },

  async suppliers(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await lookupService.parties("PURCHASE", getQuery(req));
      return sendSuccess(res, { data });
    } catch (error) {
      return next(error);
    }
  }
};
