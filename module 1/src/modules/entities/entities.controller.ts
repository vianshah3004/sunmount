import { NextFunction, Request, Response } from "express";
import { sendSuccess } from "../../common/apiResponse";
import { entitiesService } from "./entities.service";

export const entitiesController = {
  async createEntity(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await entitiesService.createEntity(req.body);
      return sendSuccess(res, {
        status: 201,
        message: "Entity created successfully",
        data: result
      });
    } catch (error) {
      return next(error);
    }
  },

  async getEntities(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await entitiesService.getEntities(req.query as Record<string, unknown>);
      return sendSuccess(res, {
        data: result.items,
        pagination: result.pagination
      });
    } catch (error) {
      return next(error);
    }
  },

  async getEntityById(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await entitiesService.getEntityById(String(req.params.id));
      return sendSuccess(res, { data: result });
    } catch (error) {
      return next(error);
    }
  },

  async updateEntity(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await entitiesService.updateEntity(String(req.params.id), req.body);
      return sendSuccess(res, {
        message: "Entity updated successfully",
        data: result
      });
    } catch (error) {
      return next(error);
    }
  },

  async deleteEntity(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await entitiesService.deleteEntity(String(req.params.id));
      return sendSuccess(res, {
        message: "Entity deleted successfully",
        data: result
      });
    } catch (error) {
      return next(error);
    }
  },

  async lookupEntity(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await entitiesService.lookupEntity(String(req.params.entityCode));
      return sendSuccess(res, { data: result });
    } catch (error) {
      return next(error);
    }
  },

  async getCustomerByCode(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await entitiesService.getCustomerByCode(String(req.params.customerId));
      return sendSuccess(res, { data: result });
    } catch (error) {
      return next(error);
    }
  },

  async getSupplierByCode(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await entitiesService.getSupplierByCode(String(req.params.supplierId));
      return sendSuccess(res, { data: result });
    } catch (error) {
      return next(error);
    }
  },

  async createOrderFromEntity(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await entitiesService.createOrderFromEntity(String(req.params.id));
      return sendSuccess(res, {
        status: 201,
        message: "Order draft created from entity successfully",
        data: result
      });
    } catch (error) {
      return next(error);
    }
  }
};
