import { NextFunction, Request, Response } from "express";
import { z } from "zod";
import { sendSuccess } from "../../common/apiResponse";
import { validateUUID } from "../../common/validation/idValidation";
import { omsService } from "./oms.service";

const orderTypeSchema = z.enum(["SALE", "PURCHASE"]);
const orderStatusSchema = z.enum([
  "DRAFT",
  "QUOTATION",
  "APPROVED",
  "PACKING",
  "DISPATCHED",
  "COMPLETED",
  "ON_HOLD",
  "CANCELLED"
]);
const paymentStatusSchema = z.enum(["UNPAID", "PARTIALLY_PAID", "PAID", "REFUNDED"]);

const lineItemSchema = z.object({
  productCode: z.string().min(1),
  quantity: z.number().int().positive(),
  unitPrice: z.number().nonnegative(),
  discountAmount: z.number().nonnegative().optional(),
  taxRate: z.number().nonnegative().optional()
});

const createOrderSchema = z
  .object({
    type: orderTypeSchema,
    customerId: z.string().uuid().optional(),
    supplierId: z.string().uuid().optional(),
    addressId: z.string().uuid().optional(),
    paymentTerms: z.string().max(128).optional(),
    owner: z.string().max(128).optional(),
    notes: z.string().optional(),
    status: orderStatusSchema.optional(),
    paymentStatus: paymentStatusSchema.optional(),
    discountAmount: z.number().nonnegative().optional(),
    freightCharges: z.number().nonnegative().optional(),
    packingCharges: z.number().nonnegative().optional(),
    deliveryDate: z.string().datetime().optional(),
    isDraft: z.boolean().optional(),
    idempotencyKey: z.string().min(6).max(128).optional(),
    items: z.array(lineItemSchema).min(1)
  })
  .superRefine((value, ctx) => {
    if (value.type === "SALE" && !value.customerId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["customerId"],
        message: "customerId is required for SALE orders"
      });
    }

    if (value.type === "PURCHASE" && !value.supplierId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["supplierId"],
        message: "supplierId is required for PURCHASE orders"
      });
    }
  });

const listOrdersQuerySchema = z.object({
  type: orderTypeSchema.optional(),
  status: orderStatusSchema.optional(),
  paymentStatus: paymentStatusSchema.optional(),
  search: z.string().optional(),
  sortBy: z.enum(["createdAt", "updatedAt", "grandTotal"]).optional(),
  sortDirection: z.enum(["asc", "desc"]).optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(200).default(20)
});

const transitionStatusSchema = z.object({
  toStatus: orderStatusSchema,
  actor: z.string().max(128).optional(),
  remarks: z.string().max(1000).optional()
});

const replaceItemsSchema = z.object({
  items: z.array(lineItemSchema).min(1)
});

export const omsController = {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const payload = createOrderSchema.parse(req.body);
      const order = await omsService.createOrder(payload);
      return sendSuccess(res, {
        status: 201,
        message: "ERP order created",
        data: order
      });
    } catch (error) {
      return next(error);
    }
  },

  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const query = listOrdersQuerySchema.parse(req.query);
      const result = await omsService.list(query);
      return sendSuccess(res, {
        data: result.data,
        pagination: {
          page: result.page,
          limit: result.pageSize,
          total: result.total
        }
      });
    } catch (error) {
      return next(error);
    }
  },

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const orderId = validateUUID(req.params.id, "orderId");
      const order = await omsService.getById(orderId);
      return sendSuccess(res, { data: order });
    } catch (error) {
      return next(error);
    }
  },

  async updateItems(req: Request, res: Response, next: NextFunction) {
    try {
      const orderId = validateUUID(req.params.id, "orderId");
      const payload = replaceItemsSchema.parse(req.body);
      const order = await omsService.replaceItems(orderId, payload);
      return sendSuccess(res, {
        message: "ERP order items updated",
        data: order
      });
    } catch (error) {
      return next(error);
    }
  },

  async transitionStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const orderId = validateUUID(req.params.id, "orderId");
      const payload = transitionStatusSchema.parse(req.body);
      const order = await omsService.transitionStatus(orderId, payload);
      return sendSuccess(res, {
        message: "ERP order status updated",
        data: order
      });
    } catch (error) {
      return next(error);
    }
  }
};
