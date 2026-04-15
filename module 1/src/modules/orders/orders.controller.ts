import { NextFunction, Request, Response } from "express";
import { z } from "zod";
import { sendSuccess } from "../../common/apiResponse";
import { ordersService } from "./orders.service";

const lineItemSchema = z.object({
  productCode: z.string().min(1),
  quantity: z.number().int().positive(),
  price: z.number().nonnegative()
});

const createOrderSchema = z.object({
  type: z.enum(["SALE", "PURCHASE"]),
  partyId: z.string().min(1),
  products: z.array(lineItemSchema).min(1),
  status: z
    .enum([
      "CREATED",
      "APPROVED",
      "ORDERED",
      "RECEIVED",
      "QUOTATION",
      "CONFIRMED",
      "PACKED",
      "QUOTATION_RECEIVED",
      "PACKING",
      "DISPATCHED",
      "DELIVERED",
      "PAID",
      "UNPAID",
      "COMPLETED",
      "CANCELLED"
    ])
    .optional(),
  notes: z.string().optional()
});

const listOrdersQuerySchema = z.object({
  type: z.enum(["SALE", "PURCHASE"]).optional(),
  status: z
    .enum([
      "CREATED",
      "APPROVED",
      "ORDERED",
      "RECEIVED",
      "QUOTATION",
      "CONFIRMED",
      "PACKED",
      "QUOTATION_RECEIVED",
      "PACKING",
      "DISPATCHED",
      "DELIVERED",
      "PAID",
      "UNPAID",
      "COMPLETED",
      "CANCELLED"
    ])
    .optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(200).default(20)
});

const updateStatusSchema = z.object({
  status: z.enum([
    "CREATED",
    "APPROVED",
    "ORDERED",
    "RECEIVED",
    "QUOTATION",
    "CONFIRMED",
    "PACKED",
    "QUOTATION_RECEIVED",
    "PACKING",
    "DISPATCHED",
    "DELIVERED",
    "PAID",
    "UNPAID",
    "COMPLETED",
    "CANCELLED"
  ]).optional(),
  partyId: z.string().min(1).optional(),
  products: z.array(lineItemSchema).min(1).optional(),
  notes: z.string().optional()
});

export const ordersController = {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      res.setHeader("Deprecation", "true");
      res.setHeader("Sunset", "Wed, 31 Dec 2026 23:59:59 GMT");
      const payload = createOrderSchema.parse(req.body);
      const order = await ordersService.createOrder(payload);
      return sendSuccess(res, {
        status: 201,
        message: "Order created (deprecated endpoint, migrate to /orders/v2)",
        data: order
      });
    } catch (error) {
      return next(error);
    }
  },

  async list(req: Request, res: Response, next: NextFunction) {
    try {
      res.setHeader("Deprecation", "true");
      res.setHeader("Sunset", "Wed, 31 Dec 2026 23:59:59 GMT");
      const query = listOrdersQuerySchema.parse(req.query);
      const response = await ordersService.listOrders(query);
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
      res.setHeader("Deprecation", "true");
      res.setHeader("Sunset", "Wed, 31 Dec 2026 23:59:59 GMT");
      const order = await ordersService.getOrderById(String(req.params.id));
      return sendSuccess(res, { data: order });
    } catch (error) {
      return next(error);
    }
  },

  async updateStatus(req: Request, res: Response, next: NextFunction) {
    try {
      res.setHeader("Deprecation", "true");
      res.setHeader("Sunset", "Wed, 31 Dec 2026 23:59:59 GMT");
      const payload = updateStatusSchema.parse(req.body);
      const order =
        payload.status && !payload.partyId && !payload.products && payload.notes === undefined
          ? await ordersService.updateOrderStatus(String(req.params.id), payload.status)
          : await ordersService.updateOrder(String(req.params.id), payload);
      return sendSuccess(res, {
        message: payload.status && !payload.partyId && !payload.products && payload.notes === undefined ? "Order status updated" : "Order updated",
        data: order
      });
    } catch (error) {
      return next(error);
    }
  },

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      res.setHeader("Deprecation", "true");
      res.setHeader("Sunset", "Wed, 31 Dec 2026 23:59:59 GMT");
      const response = await ordersService.deleteOrder(String(req.params.id));
      return sendSuccess(res, {
        message: "Order deleted (deprecated endpoint, migrate to /orders/v2)",
        data: response
      });
    } catch (error) {
      return next(error);
    }
  }
};
