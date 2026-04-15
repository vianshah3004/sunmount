import { NextFunction, Request, Response } from "express";
import { z } from "zod";
import { sendSuccess } from "../../common/apiResponse";
import { productService } from "./product.service";

const createProductSchema = z.object({
  sku: z.string().min(1),
  name: z.string().min(1),
  unit: z.string().min(1).max(16).optional(),
  description: z.string().optional(),
  weight: z.number().positive().optional(),
  price: z.number().nonnegative(),
  quantity: z.number().int().nonnegative().optional(),
  lowStockThreshold: z.number().int().nonnegative().optional()
});

const updateProductSchema = createProductSchema.partial();

const listQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(200).default(20),
  q: z.string().optional()
});

export const productController = {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const payload = createProductSchema.parse(req.body);
      const product = await productService.createProduct(payload);
      return sendSuccess(res, {
        status: 201,
        message: "Product created",
        data: product
      });
    } catch (error) {
      return next(error);
    }
  },

  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const query = listQuerySchema.parse(req.query);
      const response = await productService.listProducts(query);
      return sendSuccess(res, {
        data: response.data,
        pagination: {
          page: response.page,
          limit: response.limit,
          total: response.total
        }
      });
    } catch (error) {
      return next(error);
    }
  },

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const product = await productService.getProductById(String(req.params.id));
      return sendSuccess(res, { data: product });
    } catch (error) {
      return next(error);
    }
  },

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const id = String(req.params.id);
      const payload = updateProductSchema.parse(req.body);
      const product = await productService.updateProduct(id, payload);

      return sendSuccess(res, {
        message: "Product updated",
        data: product
      });
    } catch (error) {
      return next(error);
    }
  },

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const id = String(req.params.id);
      const product = await productService.deleteProduct(id);

      return sendSuccess(res, {
        message: "Product deleted",
        data: product
      });
    } catch (error) {
      return next(error);
    }
  }
};
