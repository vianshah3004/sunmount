import { and, asc, desc, eq, ilike, inArray, or, sql } from "drizzle-orm";
import { Router } from "express";
import { z } from "zod";
import { sendSuccess } from "./common/apiResponse";
import { AppError } from "./common/errors/AppError";
import { db } from "./db";
import { manufacturingBatches, products } from "./db/schema";
import {
  toDashboardMetrics,
  toHistoryRowFromBatch,
  toHistoryRowFromOrder,
  toInventoryItem,
  toManufacturingBatch,
  toPurchaseLines,
  toPurchaseQueueItem,
  toSalesLines,
  toSalesQueueItem
} from "./modules/apiAdapter/apiAdapterMappers";
import { dashboardService } from "./modules/dashboard/dashboard.service";
import { inventoryService } from "./modules/inventory/inventory.service";
import { manufacturingService } from "./modules/manufacturing/manufacturing.service";
import { ordersService, OrderStatus } from "./modules/orders/orders.service";
import { entitiesService } from "./modules/entities/entities.service";
import { AuthenticatedRequest } from "./modules/security/auth.middleware";
import { requireRoles } from "./modules/security/rbac.middleware";

const router = Router();

const toIso = (d: Date | string) => new Date(d).toISOString();

const listQuerySchema = z.object({
  search: z.string().optional(),
  status: z.string().optional(),
  sort: z.string().optional(),
  order: z.enum(["asc", "desc"]).optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(200).default(20),
  type: z.string().optional()
});

const parseSortDirection = (order: "asc" | "desc" | undefined) => (order === "asc" ? asc : desc);

const parseHistoryId = (value: string) => {
  const [kind, ...rest] = value.split(":");
  if (rest.length === 0) {
    throw new AppError("Invalid history id", 400, "VALIDATION_ERROR", { id: value });
  }
  return { kind, nativeId: rest.join(":") };
};

const mapFrontendStatusToOrderStatus = (status: string): OrderStatus => {
  if (status === "Dispatched") return "DISPATCHED";
  if (status === "Packed") return "PACKED";
  if (status === "Confirmed") return "CONFIRMED";
  if (status === "Approved") return "APPROVED";
  if (status === "Ordered") return "ORDERED";
  if (status === "Received") return "RECEIVED";
  if (status === "Delivered") return "DELIVERED";
  if (status === "Created") return "CREATED";
  return "QUOTATION";
};

const sortRows = <T extends Record<string, unknown>>(
  rows: T[],
  field: keyof T,
  order: "asc" | "desc" = "desc"
) => {
  const factor = order === "asc" ? 1 : -1;
  return [...rows].sort((a, b) => {
    const av = a[field];
    const bv = b[field];
    if (av === bv) return 0;
    return av! > bv! ? factor : -factor;
  });
};

const canonicalTypeSchema = z.enum(["SALE", "PURCHASE"]);

const canonicalStatusSchema = z.enum([
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
]);

const toQueueRowByType = (type: "SALE" | "PURCHASE", row: Parameters<typeof toSalesQueueItem>[0]) =>
  type === "SALE" ? toSalesQueueItem(row) : toPurchaseQueueItem(row);

const toLinesByType = (type: "SALE" | "PURCHASE", row: Parameters<typeof toSalesLines>[0]) =>
  type === "SALE" ? toSalesLines(row) : toPurchaseLines(row);

router.get("/orders", async (req, res, next) => {
  try {
    const query = z
      .object({
        type: canonicalTypeSchema,
        search: z.string().optional(),
        status: canonicalStatusSchema.optional(),
        sort: z.enum(["amount", "updated", "status", "stage"]).optional(),
        order: z.enum(["asc", "desc"]).optional(),
        page: z.coerce.number().int().positive().default(1),
        pageSize: z.coerce.number().int().positive().max(200).default(20)
      })
      .parse(req.query);

    const response = await ordersService.listOrders({
      type: query.type,
      status: query.status,
      search: query.search,
      page: query.page,
      pageSize: query.pageSize
    });

    let data = response.data.map((row) =>
      toQueueRowByType(query.type, {
        orderId: row.id,
        type: query.type,
        partyId: row.partyId,
        products: row.items,
        status: row.status,
        notes: row.notes,
        updatedAt: row.updatedAt,
        orderDate: row.orderDate
      })
    );

    if (query.sort) {
      const key = query.sort === "amount" ? "amount" : query.sort === "updated" ? "updated" : query.sort;
      data = sortRows(data as Record<string, unknown>[], key as never, query.order ?? "desc") as typeof data;
    }

    return sendSuccess(res, {
      data,
      pagination: {
        page: response.page,
        limit: response.pageSize,
        total: response.total
      }
    });
  } catch (error) {
    return next(error);
  }
});

router.get("/orders/:id/lines", async (req, res, next) => {
  try {
    const { id } = z.object({ id: z.string().uuid() }).parse(req.params);
    const { type } = z.object({ type: canonicalTypeSchema }).parse(req.query);
    const order = await ordersService.getOrderById(id);
    if (order.type !== type) {
      throw new AppError("Order type mismatch", 400, "VALIDATION_ERROR", { id, type });
    }

    return sendSuccess(res, {
      data: toLinesByType(type, {
        orderId: order.id,
        type,
        partyId: order.partyId,
        products: order.items,
        status: order.status,
        notes: order.notes,
        updatedAt: order.updatedAt,
        orderDate: order.orderDate
      })
    });
  } catch (error) {
    return next(error);
  }
});

router.put("/orders/:id/lines", async (req, res, next) => {
  try {
    const { id } = z.object({ id: z.string().uuid() }).parse(req.params);
    const payload = z
      .object({
        type: canonicalTypeSchema,
        lines: z.array(
          z.object({
            code: z.string().min(1),
            quantity: z.number().int().positive(),
            unitPrice: z.number().nonnegative()
          })
        ),
        note: z.string().optional()
      })
      .parse(req.body);

    const updated = await ordersService.updateOrder(id, {
      products: payload.lines.map((line) => ({
        productCode: line.code,
        quantity: line.quantity,
        price: line.unitPrice
      })),
      notes: payload.note
    });

    if (updated.type !== payload.type) {
      throw new AppError("Order type mismatch", 400, "VALIDATION_ERROR", { id, type: payload.type });
    }

    return sendSuccess(res, {
      data: toLinesByType(payload.type, {
        orderId: updated.id,
        type: payload.type,
        partyId: updated.partyId,
        products: updated.items,
        status: updated.status,
        notes: updated.notes,
        updatedAt: updated.updatedAt,
        orderDate: updated.orderDate
      })
    });
  } catch (error) {
    return next(error);
  }
});

router.post("/orders/:id/status", async (req, res, next) => {
  try {
    const { id } = z.object({ id: z.string().uuid() }).parse(req.params);
    const payload = z
      .object({
        type: canonicalTypeSchema,
        status: canonicalStatusSchema
      })
      .parse(req.body);
    const authReq = req as AuthenticatedRequest;
    const updated = await ordersService.updateOrderStatus(id, payload.status, {
      performedBy: authReq.auth?.userId,
      idempotencyKey: req.header("Idempotency-Key")?.trim(),
      requestId: String(res.locals.requestId ?? "unknown")
    });
    if (updated.type !== payload.type) {
      throw new AppError("Order type mismatch", 400, "VALIDATION_ERROR", { id, type: payload.type });
    }

    return sendSuccess(res, {
      data: toQueueRowByType(payload.type, {
        orderId: updated.id,
        type: payload.type,
        partyId: updated.partyId,
        products: updated.items,
        status: updated.status,
        notes: updated.notes,
        updatedAt: updated.updatedAt,
        orderDate: updated.orderDate
      })
    });
  } catch (error) {
    return next(error);
  }
});

router.get("/inventory", async (req, res, next) => {
  try {
    const query = listQuerySchema.parse(req.query);

    const whereClauses = [];
    if (query.search) {
      whereClauses.push(
        or(ilike(products.name, `%${query.search}%`), ilike(products.productCode, `%${query.search}%`))
      );
    }

    const sortDir = parseSortDirection(query.order);
    const sortColumn = query.sort === "quantity" ? products.quantity : products.updatedAt;

    const [countRow] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(products)
      .where(whereClauses.length ? and(...whereClauses) : sql`true`);

    const rows = await db
      .select()
      .from(products)
      .where(whereClauses.length ? and(...whereClauses) : sql`true`)
      .orderBy(sortDir(sortColumn))
      .limit(query.pageSize)
      .offset((query.page - 1) * query.pageSize);

    const mapped = rows.map(toInventoryItem);
    const filtered = query.status ? mapped.filter((item) => item.status === query.status) : mapped;

    return sendSuccess(res, {
      data: filtered,
      pagination: {
        page: query.page,
        limit: query.pageSize,
        total: countRow?.count ?? filtered.length
      }
    });
  } catch (error) {
    return next(error);
  }
});

router.patch("/inventory/:id/quantity", async (req, res, next) => {
  try {
    const params = z.object({ id: z.string().uuid() }).parse(req.params);
    const payload = z
      .object({
        delta: z.number().int().optional(),
        quantity: z.number().int().optional(),
        reason: z.enum(["adjust", "reorder", "dispatch"]).default("adjust")
      })
      .parse(req.body);

    const [product] = await db
      .select()
      .from(products)
      .where(eq(products.id, params.id))
      .limit(1);

    if (!product) {
      throw new AppError("Product not found", 404, "NOT_FOUND", { id: params.id });
    }

    const delta = payload.delta ?? payload.quantity;
    if (!delta || delta === 0) {
      throw new AppError("delta or quantity is required", 400, "VALIDATION_ERROR");
    }

    let type: "SALE" | "PURCHASE";
    if (payload.reason === "dispatch") {
      type = "SALE";
    } else if (payload.reason === "reorder") {
      type = "PURCHASE";
    } else {
      type = delta > 0 ? "PURCHASE" : "SALE";
    }

    await inventoryService.updateInventory({
      productCode: product.productCode,
      type,
      quantity: Math.abs(delta),
      referenceId: `api-inventory-${payload.reason}`
    });

    const [updated] = await db
      .select()
      .from(products)
      .where(eq(products.id, params.id))
      .limit(1);

    return sendSuccess(res, { data: toInventoryItem(updated) });
  } catch (error) {
    return next(error);
  }
});

router.get("/sales/orders", async (req, res, next) => {
  try {
    const query = listQuerySchema.parse(req.query);
    const response = await ordersService.listOrders({
      type: "SALE",
      search: query.search,
      page: query.page,
      pageSize: query.pageSize
    });

    let data = response.data.map((row) =>
      toSalesQueueItem({
        orderId: row.id,
        type: "SALE",
        partyId: row.partyId,
        products: row.items,
        status: row.status,
        notes: row.notes,
        updatedAt: row.updatedAt,
        orderDate: row.orderDate
      })
    );

    if (query.status) {
      data = data.filter((row) => row.status === query.status);
    }

    if (query.sort && ["amount", "updated", "status", "stage"].includes(query.sort)) {
      const key = query.sort === "amount" ? "amount" : query.sort === "updated" ? "updated" : query.sort;
      data = sortRows(data as Record<string, unknown>[], key as never, query.order ?? "desc") as typeof data;
    }

    return sendSuccess(res, {
      data,
      pagination: {
        page: response.page,
        limit: response.pageSize,
        total: response.total
      }
    });
  } catch (error) {
    return next(error);
  }
});

router.get("/sales/orders/:id/lines", async (req, res, next) => {
  try {
    const { id } = z.object({ id: z.string().uuid() }).parse(req.params);
    const order = await ordersService.getOrderById(id);
    if (order.type !== "SALE") {
      throw new AppError("Order is not a sales order", 400, "VALIDATION_ERROR", { id });
    }
    return sendSuccess(res, { data: toSalesLines(order) });
  } catch (error) {
    return next(error);
  }
});

router.put("/sales/orders/:id/lines", async (req, res, next) => {
  try {
    const { id } = z.object({ id: z.string().uuid() }).parse(req.params);
    const payload = z
      .object({
        lines: z.array(
          z.object({
            code: z.string().min(1),
            quantity: z.number().int().positive(),
            unitPrice: z.number().nonnegative()
          })
        ),
        note: z.string().optional()
      })
      .parse(req.body);

    const updated = await ordersService.updateOrder(id, {
      products: payload.lines.map((line) => ({
        productCode: line.code,
        quantity: line.quantity,
        price: line.unitPrice
      })),
      notes: payload.note
    });

    return sendSuccess(res, {
      data: toSalesLines({
        orderId: updated.id,
        type: "SALE",
        partyId: updated.partyId,
        products: updated.items,
        status: updated.status,
        notes: updated.notes,
        updatedAt: updated.updatedAt,
        orderDate: updated.orderDate
      })
    });
  } catch (error) {
    return next(error);
  }
});

router.post("/sales/orders/:id/finalize-dispatch", requireRoles(["OPERATOR", "ADMIN"]), async (req, res, next) => {
  try {
    const { id } = z.object({ id: z.string().uuid() }).parse(req.params);
    const authReq = req as AuthenticatedRequest;
    const updated = await ordersService.updateOrderStatus(id, "DISPATCHED", {
      performedBy: authReq.auth?.userId,
      idempotencyKey: req.header("Idempotency-Key")?.trim(),
      requestId: String(res.locals.requestId ?? "unknown")
    });
    if (updated.type !== "SALE") {
      throw new AppError("Order is not a sales order", 400, "VALIDATION_ERROR", { id });
    }
    return sendSuccess(res, { data: toSalesQueueItem({ ...updated, orderId: updated.id }) });
  } catch (error) {
    return next(error);
  }
});

router.get("/purchase/orders", async (req, res, next) => {
  try {
    const query = listQuerySchema.parse(req.query);
    const response = await ordersService.listOrders({
      type: "PURCHASE",
      search: query.search,
      page: query.page,
      pageSize: query.pageSize
    });

    let data = response.data.map((row) =>
      toPurchaseQueueItem({
        orderId: row.id,
        type: "PURCHASE",
        partyId: row.partyId,
        products: row.items,
        status: row.status,
        notes: row.notes,
        updatedAt: row.updatedAt,
        orderDate: row.orderDate
      })
    );
    if (query.status) {
      data = data.filter((row) => row.status === query.status);
    }
    if (query.sort && ["amount", "updated", "status", "stage"].includes(query.sort)) {
      const key = query.sort === "amount" ? "amount" : query.sort === "updated" ? "updated" : query.sort;
      data = sortRows(data as Record<string, unknown>[], key as never, query.order ?? "desc") as typeof data;
    }

    return sendSuccess(res, {
      data,
      pagination: {
        page: response.page,
        limit: response.pageSize,
        total: response.total
      }
    });
  } catch (error) {
    return next(error);
  }
});

router.get("/purchase/orders/:id/lines", async (req, res, next) => {
  try {
    const { id } = z.object({ id: z.string().uuid() }).parse(req.params);
    const order = await ordersService.getOrderById(id);
    if (order.type !== "PURCHASE") {
      throw new AppError("Order is not a purchase order", 400, "VALIDATION_ERROR", { id });
    }
    return sendSuccess(res, { data: toPurchaseLines(order) });
  } catch (error) {
    return next(error);
  }
});

router.put("/purchase/orders/:id/lines", async (req, res, next) => {
  try {
    const { id } = z.object({ id: z.string().uuid() }).parse(req.params);
    const payload = z
      .object({
        lines: z.array(
          z.object({
            code: z.string().min(1),
            quantity: z.number().int().positive(),
            unitPrice: z.number().nonnegative()
          })
        ),
        note: z.string().optional()
      })
      .parse(req.body);

    const updated = await ordersService.updateOrder(id, {
      products: payload.lines.map((line) => ({
        productCode: line.code,
        quantity: line.quantity,
        price: line.unitPrice
      })),
      notes: payload.note
    });

    return sendSuccess(res, {
      data: toPurchaseLines({
        orderId: updated.id,
        type: "PURCHASE",
        partyId: updated.partyId,
        products: updated.items,
        status: updated.status,
        notes: updated.notes,
        updatedAt: updated.updatedAt,
        orderDate: updated.orderDate
      })
    });
  } catch (error) {
    return next(error);
  }
});

router.post("/purchase/orders/:id/complete", requireRoles(["ACCOUNTANT", "ADMIN"]), async (req, res, next) => {
  try {
    const { id } = z.object({ id: z.string().uuid() }).parse(req.params);
    const authReq = req as AuthenticatedRequest;
    const updated = await ordersService.updateOrderStatus(id, "COMPLETED", {
      performedBy: authReq.auth?.userId,
      idempotencyKey: req.header("Idempotency-Key")?.trim(),
      requestId: String(res.locals.requestId ?? "unknown")
    });
    if (updated.type !== "PURCHASE") {
      throw new AppError("Order is not a purchase order", 400, "VALIDATION_ERROR", { id });
    }
    return sendSuccess(res, { data: toPurchaseQueueItem({ ...updated, orderId: updated.id }) });
  } catch (error) {
    return next(error);
  }
});

router.get("/manufacturing/batches", async (req, res, next) => {
  try {
    const query = listQuerySchema.parse(req.query);
    const whereClauses = [];
    if (query.status) {
      const mappedStatus = query.status === "Approved" ? "COMPLETED" : "IN_PROGRESS";
      whereClauses.push(eq(manufacturingBatches.status, mappedStatus));
    }
    if (query.search) {
      whereClauses.push(ilike(manufacturingBatches.batchNumber, `%${query.search}%`));
    }

    const [countRow] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(manufacturingBatches)
      .where(whereClauses.length ? and(...whereClauses) : sql`true`);

    const sortDir = parseSortDirection(query.order);
    const rows = await db
      .select()
      .from(manufacturingBatches)
      .where(whereClauses.length ? and(...whereClauses) : sql`true`)
      .orderBy(sortDir(manufacturingBatches.updatedAt))
      .limit(query.pageSize)
      .offset((query.page - 1) * query.pageSize);

    return sendSuccess(res, {
      data: rows.map(toManufacturingBatch),
      pagination: {
        page: query.page,
        limit: query.pageSize,
        total: countRow?.count ?? 0
      }
    });
  } catch (error) {
    return next(error);
  }
});

router.patch("/manufacturing/batches/:id", async (req, res, next) => {
  try {
    const { id } = z.object({ id: z.string().min(1) }).parse(req.params);
    const payload = z
      .object({
        title: z.string().optional(),
        output: z.array(z.object({ productCode: z.string().min(1), quantity: z.number().int().positive() })).optional(),
        eta: z.string().datetime().optional(),
        notes: z.string().optional(),
        status: z.enum(["IN_PROGRESS", "COMPLETED", "CANCELLED"]).optional()
      })
      .parse(req.body);

    if (payload.output || payload.notes || payload.title) {
      await manufacturingService.updateBatch(id, {
        outputProducts: payload.output,
        notes: payload.notes ?? payload.title
      });
    }

    if (payload.status) {
      await manufacturingService.updateStatus(id, payload.status);
    }

    if (payload.eta) {
      await db
        .update(manufacturingBatches)
        .set({ endDate: new Date(payload.eta), updatedAt: new Date() })
        .where(eq(manufacturingBatches.batchNumber, id));
    }

    const updated = await manufacturingService.getBatchById(id);
    return sendSuccess(res, { data: toManufacturingBatch({ ...updated, batchNumber: updated.id }) });
  } catch (error) {
    return next(error);
  }
});

router.delete("/manufacturing/batches/:id", async (req, res, next) => {
  try {
    const { id } = z.object({ id: z.string().min(1) }).parse(req.params);
    await manufacturingService.deleteBatch(id);
    return sendSuccess(res, { data: { id, deleted: true } });
  } catch (error) {
    return next(error);
  }
});

router.post("/manufacturing/batches/:id/start", requireRoles(["OPERATOR", "ADMIN"]), async (req, res, next) => {
  try {
    const { id } = z.object({ id: z.string().min(1) }).parse(req.params);
    const authReq = req as AuthenticatedRequest;
    const updated = await manufacturingService.startBatch(id, {
      performedBy: authReq.auth?.userId,
      idempotencyKey: req.header("Idempotency-Key")?.trim(),
      requestId: String(res.locals.requestId ?? "unknown")
    });
    return sendSuccess(res, { data: toManufacturingBatch({ ...updated, batchNumber: updated.id }) });
  } catch (error) {
    return next(error);
  }
});

router.post("/manufacturing/batches/:id/complete", requireRoles(["OPERATOR", "ADMIN"]), async (req, res, next) => {
  try {
    const { id } = z.object({ id: z.string().min(1) }).parse(req.params);
    const authReq = req as AuthenticatedRequest;
    const updated = await manufacturingService.completeBatch(id, {
      performedBy: authReq.auth?.userId,
      idempotencyKey: req.header("Idempotency-Key")?.trim(),
      requestId: String(res.locals.requestId ?? "unknown")
    });
    return sendSuccess(res, { data: toManufacturingBatch({ ...updated, batchNumber: updated.id }) });
  } catch (error) {
    return next(error);
  }
});

router.get("/history", async (req, res, next) => {
  try {
    const query = listQuerySchema.parse(req.query);
    const [saleOrders, purchaseOrders] = await Promise.all([
      ordersService.listOrders({ type: "SALE", page: 1, pageSize: 200, search: query.search }),
      ordersService.listOrders({ type: "PURCHASE", page: 1, pageSize: 200, search: query.search })
    ]);
    const batchRows = await db.select().from(manufacturingBatches);

    const mappedOrderRows = [...saleOrders.data, ...purchaseOrders.data].map((row) =>
      toHistoryRowFromOrder({
        orderId: row.id,
        type: row.type,
        partyId: row.partyId,
        products: row.items,
        status: row.status,
        orderDate: row.orderDate,
        notes: row.notes,
        updatedAt: row.updatedAt
      })
    );

    let rows = [...mappedOrderRows, ...batchRows.map(toHistoryRowFromBatch)];

    if (query.type) {
      rows = rows.filter((row) => row.type.toLowerCase() === query.type?.toLowerCase());
    }
    if (query.status) {
      rows = rows.filter((row) => row.status === query.status);
    }
    if (query.search) {
      const needle = query.search.toLowerCase();
      rows = rows.filter(
        (row) =>
          row.party.toLowerCase().includes(needle) ||
          row.note?.toLowerCase().includes(needle) ||
          row.type.toLowerCase().includes(needle)
      );
    }

    const sortField = query.sort === "value" ? "value" : query.sort === "status" ? "status" : query.sort === "type" ? "type" : "date";
    rows = sortRows(rows as Record<string, unknown>[], sortField as never, query.order ?? "desc") as typeof rows;

    const start = (query.page - 1) * query.pageSize;
    const paginated = rows.slice(start, start + query.pageSize);

    return sendSuccess(res, {
      data: paginated,
      pagination: {
        page: query.page,
        limit: query.pageSize,
        total: rows.length
      }
    });
  } catch (error) {
    return next(error);
  }
});

router.patch("/history/:id", async (req, res, next) => {
  try {
    const { id } = z.object({ id: z.string().min(1) }).parse(req.params);
    const payload = z.object({ status: z.string().optional(), note: z.string().optional() }).parse(req.body);

    const { kind, nativeId } = parseHistoryId(id);
    if (kind === "sale" || kind === "purchase") {
      if (payload.status) {
        await ordersService.updateOrderStatus(nativeId, mapFrontendStatusToOrderStatus(payload.status));
      }
      if (payload.note !== undefined) {
        await ordersService.updateOrder(nativeId, { notes: payload.note });
      }
      const updated = await ordersService.getOrderById(nativeId);
      return sendSuccess(res, {
        data: toHistoryRowFromOrder({
          orderId: updated.id,
          type: updated.type,
          partyId: updated.partyId,
          products: updated.items,
          status: updated.status,
          orderDate: updated.orderDate,
          notes: updated.notes,
          updatedAt: updated.updatedAt
        })
      });
    }

    if (kind === "manufacturing") {
      if (payload.status) {
        await manufacturingService.updateStatus(
          nativeId,
          payload.status === "Approved" ? "COMPLETED" : payload.status === "Dispatched" ? "COMPLETED" : "IN_PROGRESS"
        );
      }
      if (payload.note !== undefined) {
        await manufacturingService.updateBatch(nativeId, { notes: payload.note });
      }
      const updated = await manufacturingService.getBatchById(nativeId);
      return sendSuccess(res, { data: toHistoryRowFromBatch({ ...updated, batchNumber: updated.id }) });
    }

    throw new AppError("Unsupported history type", 400, "VALIDATION_ERROR", { id });
  } catch (error) {
    return next(error);
  }
});

router.post("/history/:id/next-stage", async (req, res, next) => {
  try {
    const { id } = z.object({ id: z.string().min(1) }).parse(req.params);
    const { kind, nativeId } = parseHistoryId(id);

    if (kind === "sale" || kind === "purchase") {
      const authReq = req as AuthenticatedRequest;
      const order = await ordersService.getOrderById(nativeId);
      const nextMap: Partial<Record<OrderStatus, OrderStatus>> =
        kind === "sale"
          ? {
              QUOTATION: "CONFIRMED",
              CONFIRMED: "PACKED",
              PACKED: "DISPATCHED",
              DISPATCHED: "DELIVERED",
              DELIVERED: "PAID"
            }
          : {
              CREATED: "APPROVED",
              APPROVED: "ORDERED",
              ORDERED: "RECEIVED",
              RECEIVED: "COMPLETED"
            };

      const nextStatus = nextMap[order.status as OrderStatus];
      if (!nextStatus) {
        throw new AppError("No next stage available", 400, "VALIDATION_ERROR", { id });
      }

      if (kind === "purchase" && nextStatus === "PAID") {
        const actorRole = authReq.auth?.role;
        if (actorRole !== "ACCOUNTANT" && actorRole !== "ADMIN") {
          throw new AppError("Only ACCOUNTANT or ADMIN can mark purchase as paid", 403, "FORBIDDEN", {
            orderId: nativeId,
            required: ["ACCOUNTANT", "ADMIN"]
          });
        }
      }

      const updated = await ordersService.updateOrderStatus(nativeId, nextStatus, {
        performedBy: authReq.auth?.userId,
        idempotencyKey: req.header("Idempotency-Key")?.trim(),
        requestId: String(res.locals.requestId ?? "unknown")
      });
      return sendSuccess(res, {
        data: toHistoryRowFromOrder({
          orderId: updated.id,
          type: updated.type,
          partyId: updated.partyId,
          products: updated.items,
          status: updated.status,
          orderDate: updated.orderDate,
          notes: updated.notes,
          updatedAt: updated.updatedAt
        })
      });
    }

    if (kind === "manufacturing") {
      const updated = await manufacturingService.completeBatch(nativeId);
      return sendSuccess(res, { data: toHistoryRowFromBatch({ ...updated, batchNumber: updated.id }) });
    }

    throw new AppError("Unsupported history type", 400, "VALIDATION_ERROR", { id });
  } catch (error) {
    return next(error);
  }
});

router.delete("/history/:id", async (req, res, next) => {
  try {
    const { id } = z.object({ id: z.string().min(1) }).parse(req.params);
    const { kind, nativeId } = parseHistoryId(id);

    if (kind === "sale" || kind === "purchase") {
      await ordersService.deleteOrder(nativeId);
      return sendSuccess(res, { data: { id, deleted: true } });
    }

    if (kind === "manufacturing") {
      await manufacturingService.deleteBatch(nativeId);
      return sendSuccess(res, { data: { id, deleted: true } });
    }

    throw new AppError("Unsupported history type", 400, "VALIDATION_ERROR", { id });
  } catch (error) {
    return next(error);
  }
});

router.get("/dashboard/metrics", async (_req, res, next) => {
  try {
    const summary = await dashboardService.getSummary();
    return sendSuccess(res, { data: toDashboardMetrics(summary) });
  } catch (error) {
    return next(error);
  }
});

router.get("/entities", async (req, res, next) => {
  try {
    const query = z
      .object({
        type: z.string().optional(),
        search: z.string().optional(),
        page: z.coerce.number().int().positive().default(1),
        pageSize: z.coerce.number().int().positive().max(200).default(20)
      })
      .parse(req.query);

    const result = await entitiesService.getEntities({
      page: query.page,
      limit: query.pageSize,
      search: query.search,
      type: query.type
    });

    const paginated = result.items.map((entity) => ({
      id: entity.id,
      type: entity.type,
      name: entity.name,
      contact: entity.contact,
      location: entity.location,
      value: entity.value,
      status: entity.status,
      mode: entity.mode,
      updated: entity.updatedAt
    }));

    return sendSuccess(res, {
      data: paginated,
      pagination: {
        page: query.page,
        limit: query.pageSize,
        total: result.pagination.total
      }
    });
  } catch (error) {
    return next(error);
  }
});

router.get("/entities/:id", async (req, res, next) => {
  try {
    const { id } = z.object({ id: z.string().min(1) }).parse(req.params);
    const entity = await entitiesService.getEntityById(id);

    return sendSuccess(res, {
      data: {
        id: entity.id,
        type: entity.type,
        name: entity.name,
        contact: entity.contact,
        location: entity.location,
        value: entity.value,
        status: entity.status,
        mode: entity.mode,
        updated: entity.updatedAt
      }
    });
  } catch (error) {
    return next(error);
  }
});

router.get("/entities/lookup/:entityCode", async (req, res, next) => {
  try {
    const { entityCode } = z.object({ entityCode: z.string().min(1) }).parse(req.params);
    const row = await entitiesService.lookupEntity(entityCode);

    return sendSuccess(res, {
      data: {
        id: row.id,
        type: row.entityType,
        name: row.entityName,
        contact: row.entityCode,
        location: "Unknown",
        value: 0,
        status: "Approved",
        mode: row.entityType === "Customer" ? "Credit" : "Prepaid",
        updated: new Date().toISOString()
      }
    });
  } catch (error) {
    return next(error);
  }
});

export const apiAdapterRoutes = router;
