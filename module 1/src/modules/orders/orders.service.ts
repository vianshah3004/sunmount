import { and, desc, eq, ilike, inArray, sql } from "drizzle-orm";
import { AppError, mapDatabaseError } from "../../common/errors/AppError";
import { toOrderView } from "../../common/presenters";
import { emitOrderUpdate } from "../../common/socket";
import { logger } from "../../common/logger";
import { db } from "../../db";
import { OrderLineItem, erpOrderEvents, erpOrderItems, erpOrders, products } from "../../db/schema";
import { applyInventoryChangeWithTx } from "../inventory/inventory.service";
import { transitionLogsService } from "../transitionLogs/transitionLogs.service";

export type OrderType = "SALE" | "PURCHASE";
export type OrderStatus =
  | "QUOTATION"
  | "CONFIRMED"
  | "PACKED"
  | "QUOTATION_RECEIVED"
  | "CREATED"
  | "APPROVED"
  | "ORDERED"
  | "RECEIVED"
  | "PACKING"
  | "DISPATCHED"
  | "DELIVERED"
  | "PAID"
  | "UNPAID"
  | "COMPLETED"
  | "CANCELLED";

type ErpCompatStatus = "DRAFT" | "QUOTATION" | "APPROVED" | "PACKING" | "DISPATCHED" | "COMPLETED" | "ON_HOLD" | "CANCELLED";
type ErpCompatPayment = "UNPAID" | "PARTIALLY_PAID" | "PAID" | "REFUNDED";

const shouldApplyInventory = (type: OrderType, status: OrderStatus) =>
  (type === "SALE" && status === "DISPATCHED") ||
  (type === "PURCHASE" && (status === "RECEIVED" || status === "COMPLETED"));

const SALE_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  QUOTATION: ["CONFIRMED", "PACKING", "DISPATCHED", "CANCELLED"],
  CONFIRMED: ["PACKED", "PACKING", "CANCELLED"],
  PACKED: ["DISPATCHED", "CANCELLED"],
  PACKING: ["DISPATCHED", "CANCELLED"],
  DISPATCHED: ["DELIVERED", "COMPLETED"],
  DELIVERED: ["PAID", "COMPLETED"],
  PAID: [],
  COMPLETED: ["PAID"],
  CANCELLED: [],
  QUOTATION_RECEIVED: [],
  CREATED: [],
  APPROVED: [],
  ORDERED: [],
  RECEIVED: [],
  UNPAID: []
};

const PURCHASE_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  CREATED: ["APPROVED", "QUOTATION_RECEIVED", "CANCELLED"],
  APPROVED: ["ORDERED", "UNPAID", "PAID", "CANCELLED"],
  ORDERED: ["RECEIVED", "UNPAID", "PAID", "CANCELLED"],
  RECEIVED: ["COMPLETED", "PAID", "UNPAID"],
  UNPAID: ["PAID", "RECEIVED", "COMPLETED", "CANCELLED"],
  PAID: ["COMPLETED"],
  QUOTATION_RECEIVED: ["UNPAID", "PAID", "APPROVED", "ORDERED", "CANCELLED"],
  COMPLETED: [],
  CANCELLED: [],
  QUOTATION: [],
  CONFIRMED: [],
  PACKED: [],
  PACKING: [],
  DISPATCHED: [],
  DELIVERED: []
};

const mapLegacyToErp = (type: OrderType, status?: OrderStatus) => {
  if (type === "SALE") {
    const normalized = status ?? "QUOTATION";
    const erpStatus: ErpCompatStatus =
      normalized === "QUOTATION"
        ? "QUOTATION"
        : normalized === "CONFIRMED"
          ? "APPROVED"
          : normalized === "PACKED" || normalized === "PACKING"
          ? "PACKING"
          : normalized === "DISPATCHED"
            ? "DISPATCHED"
            : normalized === "DELIVERED" || normalized === "COMPLETED"
              ? "COMPLETED"
              : normalized === "CANCELLED"
                ? "CANCELLED"
                : "QUOTATION";
    return {
      status: erpStatus,
      paymentStatus: normalized === "PAID" ? "PAID" as ErpCompatPayment : "UNPAID" as ErpCompatPayment
    };
  }

  const normalized = status ?? "CREATED";
  if (normalized === "CREATED") {
    return { status: "DRAFT" as ErpCompatStatus, paymentStatus: "UNPAID" as ErpCompatPayment };
  }
  if (normalized === "APPROVED") {
    return { status: "QUOTATION" as ErpCompatStatus, paymentStatus: "UNPAID" as ErpCompatPayment };
  }
  if (normalized === "ORDERED") {
    return { status: "APPROVED" as ErpCompatStatus, paymentStatus: "UNPAID" as ErpCompatPayment };
  }
  if (normalized === "RECEIVED") {
    return { status: "COMPLETED" as ErpCompatStatus, paymentStatus: "UNPAID" as ErpCompatPayment };
  }
  if (normalized === "COMPLETED") {
    return { status: "COMPLETED" as ErpCompatStatus, paymentStatus: "PAID" as ErpCompatPayment };
  }
  if (normalized === "PAID") {
    return { status: "COMPLETED" as ErpCompatStatus, paymentStatus: "PAID" as ErpCompatPayment };
  }
  if (normalized === "UNPAID") {
    return { status: "APPROVED" as ErpCompatStatus, paymentStatus: "UNPAID" as ErpCompatPayment };
  }
  if (normalized === "QUOTATION_RECEIVED") {
    return { status: "QUOTATION" as ErpCompatStatus, paymentStatus: "UNPAID" as ErpCompatPayment };
  }
  if (normalized === "CANCELLED") {
    return { status: "CANCELLED" as ErpCompatStatus, paymentStatus: "UNPAID" as ErpCompatPayment };
  }
  return { status: "DRAFT" as ErpCompatStatus, paymentStatus: "UNPAID" as ErpCompatPayment };
};

const mapErpToLegacy = (type: OrderType, status: string, paymentStatus: string): OrderStatus => {
  if (type === "SALE") {
    if (status === "APPROVED") return "CONFIRMED";
    if (status === "PACKING") return "PACKED";
    if (status === "DISPATCHED") return "DISPATCHED";
    if (status === "COMPLETED" && paymentStatus === "PAID") return "PAID";
    if (status === "COMPLETED") return "DELIVERED";
    if (status === "CANCELLED") return "CANCELLED";
    return "QUOTATION";
  }

  // PURCHASE order mapping
  if (status === "DRAFT") return "CREATED";
  if (status === "QUOTATION") return "APPROVED";
  if (status === "APPROVED") return paymentStatus === "PAID" ? "PAID" : "ORDERED";
  if (status === "COMPLETED" && paymentStatus !== "PAID") return "RECEIVED";
  if (status === "COMPLETED") return "COMPLETED";
  if (status === "CANCELLED") return "CANCELLED";
  
  // For PURCHASE: check status first to determine the correct legacy state
  if (status === "QUOTATION" || status === "DRAFT") {
    return "QUOTATION_RECEIVED"; // New/draft purchase orders start here
  }
  
  if (status === "APPROVED") {
    if (paymentStatus === "PAID") return "PAID";
    if (paymentStatus === "UNPAID" || paymentStatus === "PARTIALLY_PAID") return "UNPAID";
  }
  
  // Fallback based on payment status
  if (paymentStatus === "PAID") return "PAID";
  if (paymentStatus === "UNPAID" || paymentStatus === "PARTIALLY_PAID") return "UNPAID";
  
  return "QUOTATION_RECEIVED";
};

const getAllowedTransitions = (type: OrderType, currentStatus: OrderStatus) => {
  const transitions = type === "SALE" ? SALE_TRANSITIONS[currentStatus] : PURCHASE_TRANSITIONS[currentStatus];
  return transitions ?? [];
};

type QueryExecutor = Pick<typeof db, "select">;

const readCompatOrder = async (orderId: string, executor: QueryExecutor = db) => {
  const [order] = await executor.select().from(erpOrders).where(eq(erpOrders.id, orderId)).limit(1);
  if (!order) {
    throw new AppError("Order not found", 404, "NOT_FOUND", { orderId });
  }

  const items = await executor
    .select()
    .from(erpOrderItems)
    .where(eq(erpOrderItems.orderId, orderId))
    .orderBy(erpOrderItems.lineNumber);

  const type = order.type as OrderType;
  const partyId = order.owner ?? (order.customerId ?? order.supplierId ?? "UNKNOWN");
  const products = items.map((item) => ({
    productCode: item.sku,
    quantity: item.quantity,
    price: Number(item.unitPrice)
  }));
  const inventoryApplied =
    type === "SALE"
      ? items.every((item) => item.dispatchedQty >= item.quantity)
      : items.every((item) => item.receivedQty >= item.quantity);
  const legacyStatus = mapErpToLegacy(type, order.status, order.paymentStatus);

  return toOrderView({
    orderId: order.id,
    type,
    partyId,
    products,
    status: legacyStatus,
    orderDate: order.createdAt,
    notes: order.notes,
    inventoryApplied,
    updatedAt: order.updatedAt
  });
};

export const ordersService = {
  async createOrder(input: {
    type: OrderType;
    partyId: string;
    products: OrderLineItem[];
    status?: OrderStatus;
    notes?: string;
  }) {
    try {
      const codes = input.products.map((line) => line.productCode);
      const uniqueCodes = [...new Set(codes)];
      const productRows = await db
        .select({ id: products.id, code: products.productCode, name: products.name, price: products.price })
        .from(products)
        .where(inArray(products.productCode, uniqueCodes));
      const byCode = new Map(productRows.map((row) => [row.code, row]));
      if (productRows.length !== uniqueCodes.length) {
        const missing = uniqueCodes.filter((code) => !byCode.has(code));
        throw new AppError("Some products do not exist", 400, "VALIDATION_ERROR", { missing });
      }

      const mappedState = mapLegacyToErp(input.type, input.status);

      const createdOrder = await db.transaction(async (tx) => {
        const [header] = await tx
          .insert(erpOrders)
          .values({
            orderNumber: `${input.type === "SALE" ? "SO" : "PO"}-${Date.now()}`,
            type: input.type,
            status: mappedState.status,
            paymentStatus: mappedState.paymentStatus,
            owner: input.partyId,
            notes: input.notes,
            isDraft: false,
            metadata: {
              compatibility: "orders-v1",
              partyId: input.partyId
            }
          })
          .returning();

        const rows = input.products.map((line, index) => {
          const product = byCode.get(line.productCode)!;
          const quantity = Math.max(1, Math.trunc(line.quantity));
          const unitPrice = Number.isFinite(line.price) ? line.price : Number(product.price);
          const lineTotal = quantity * unitPrice;
          return {
            orderId: header.id,
            lineNumber: index + 1,
            productId: product.id,
            sku: line.productCode,
            name: product.name,
            quantity,
            unitPrice: unitPrice.toFixed(2),
            discountAmount: "0.00",
            taxRate: "0.00",
            taxAmount: "0.00",
            lineTotal: lineTotal.toFixed(2)
          };
        });

        await tx.insert(erpOrderItems).values(rows);

        const subtotal = rows.reduce((sum, row) => sum + Number(row.lineTotal), 0);
        await tx
          .update(erpOrders)
          .set({
            subtotalAmount: subtotal.toFixed(2),
            grandTotal: subtotal.toFixed(2),
            updatedAt: new Date()
          })
          .where(eq(erpOrders.id, header.id));

        await tx.insert(erpOrderEvents).values({
          orderId: header.id,
          action: "COMPAT_ORDER_CREATED",
          actor: "system",
          metadata: { source: "orders-v1" }
        });

        return header;
      });

      emitOrderUpdate({
        orderId: createdOrder.id,
        type: createdOrder.type,
        status: mapErpToLegacy(input.type, createdOrder.status, createdOrder.paymentStatus)
      });

      return readCompatOrder(createdOrder.id);
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }

      logger.error("Unexpected createOrder failure", {
        error,
        inputSummary: {
          type: input.type,
          partyId: input.partyId,
          itemCount: input.products.length
        }
      });

      throw mapDatabaseError(error, "Failed to create order");
    }
  },

  async listOrders(filters: {
    type?: OrderType;
    status?: OrderStatus;
    search?: string;
    page: number;
    pageSize: number;
  }) {
    const whereClauses = [];

    if (filters.type) {
      whereClauses.push(eq(erpOrders.type, filters.type));
    }
    if (filters.search) {
      whereClauses.push(ilike(erpOrders.owner, `%${filters.search}%`));
    }

    const where = whereClauses.length > 0 ? and(...whereClauses) : undefined;

    const [countRow] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(erpOrders)
      .where(where ?? sql`true`);

    const rows = await db
      .select()
      .from(erpOrders)
      .where(where ?? sql`true`)
      .orderBy(desc(erpOrders.createdAt))
      .limit(filters.pageSize)
      .offset((filters.page - 1) * filters.pageSize);

    const itemsByOrder = new Map<string, Array<{ productCode: string; quantity: number; price: number }>>();
    if (rows.length > 0) {
      const orderIds = rows.map((row) => row.id);
      const itemRows = await db
        .select()
        .from(erpOrderItems)
        .where(inArray(erpOrderItems.orderId, orderIds));
      for (const item of itemRows) {
        const bucket = itemsByOrder.get(item.orderId) ?? [];
        bucket.push({ productCode: item.sku, quantity: item.quantity, price: Number(item.unitPrice) });
        itemsByOrder.set(item.orderId, bucket);
      }
    }

    let data = rows.map((row) => {
      const legacyStatus = mapErpToLegacy(row.type as OrderType, row.status, row.paymentStatus);
      return toOrderView({
        orderId: row.id,
        type: row.type as OrderType,
        partyId: row.owner ?? (row.customerId ?? row.supplierId ?? "UNKNOWN"),
        products: itemsByOrder.get(row.id) ?? [],
        status: legacyStatus,
        orderDate: row.createdAt,
        notes: row.notes,
        inventoryApplied: false,
        updatedAt: row.updatedAt
      });
    });

    if (filters.status) {
      data = data.filter((row) => row.status === filters.status);
    }

    return {
      page: filters.page,
      pageSize: filters.pageSize,
      total: countRow?.count ?? 0,
      data
    };
  },

  async getOrderById(orderId: string) {
    return readCompatOrder(orderId);
  },

  async updateOrder(orderId: string, input: {
    partyId?: string;
    products?: OrderLineItem[];
    status?: OrderStatus;
    notes?: string;
  }) {
    try {
      await db.transaction(async (tx) => {
        const [existingOrder] = await tx.select().from(erpOrders).where(eq(erpOrders.id, orderId)).limit(1);
        if (!existingOrder) {
          throw new AppError("Order not found", 404, "NOT_FOUND", { orderId });
        }

        await tx
          .update(erpOrders)
          .set({
            ...(input.partyId ? { owner: input.partyId } : {}),
            ...(input.notes !== undefined ? { notes: input.notes } : {}),
            updatedAt: new Date()
          })
          .where(eq(erpOrders.id, orderId));

        if (input.products) {
          const codes = input.products.map((line) => line.productCode);
          const uniqueCodes = [...new Set(codes)];
          const productRows = await tx
            .select({ id: products.id, code: products.productCode, name: products.name })
            .from(products)
            .where(inArray(products.productCode, uniqueCodes));
          const byCode = new Map(productRows.map((row) => [row.code, row]));
          if (productRows.length !== uniqueCodes.length) {
            const missing = uniqueCodes.filter((code) => !byCode.has(code));
            throw new AppError("Some products do not exist", 400, "VALIDATION_ERROR", { missing });
          }

          await tx.delete(erpOrderItems).where(eq(erpOrderItems.orderId, orderId));
          const rows = input.products.map((line, index) => {
            const product = byCode.get(line.productCode)!;
            const quantity = Math.max(1, Math.trunc(line.quantity));
            const unitPrice = Number.isFinite(line.price) ? line.price : 0;
            const lineTotal = quantity * unitPrice;
            return {
              orderId,
              lineNumber: index + 1,
              productId: product.id,
              sku: line.productCode,
              name: product.name,
              quantity,
              unitPrice: unitPrice.toFixed(2),
              discountAmount: "0.00",
              taxRate: "0.00",
              taxAmount: "0.00",
              lineTotal: lineTotal.toFixed(2)
            };
          });
          await tx.insert(erpOrderItems).values(rows);

          const subtotal = rows.reduce((sum, row) => sum + Number(row.lineTotal), 0);
          await tx
            .update(erpOrders)
            .set({ subtotalAmount: subtotal.toFixed(2), grandTotal: subtotal.toFixed(2), updatedAt: new Date() })
            .where(eq(erpOrders.id, orderId));
        }

        await tx.insert(erpOrderEvents).values({
          orderId,
          action: "COMPAT_ORDER_UPDATED",
          actor: "system",
          metadata: { source: "orders-v1" }
        });
      });

      if (input.status) {
        return this.updateOrderStatus(orderId, input.status);
      }

      const updatedOrder = await this.getOrderById(orderId);
      emitOrderUpdate({
        orderId,
        type: updatedOrder.type,
        status: updatedOrder.status
      });

      return updatedOrder;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw mapDatabaseError(error, "Failed to update order");
    }
  },

  async updateOrderStatus(
    orderId: string,
    status: OrderStatus,
    context?: {
      performedBy?: string;
      idempotencyKey?: string;
      requestId?: string;
    }
  ) {
    try {
      return await db.transaction(async (tx) => {
        const [existingOrder] = await tx.select().from(erpOrders).where(eq(erpOrders.id, orderId)).limit(1);

        if (!existingOrder) {
          throw new AppError("Order not found", 404, "NOT_FOUND", { orderId });
        }

        const items = await tx
          .select()
          .from(erpOrderItems)
          .where(eq(erpOrderItems.orderId, orderId));

        const type = existingOrder.type as OrderType;
        const currentStatus = mapErpToLegacy(type, existingOrder.status, existingOrder.paymentStatus);
        if (currentStatus !== status) {
          const allowedTransitions = getAllowedTransitions(type, currentStatus);
          if (!allowedTransitions.includes(status)) {
            throw new AppError("Invalid order status transition", 409, "CONFLICT", {
              orderId,
              from: currentStatus,
              to: status,
              allowed: allowedTransitions
            });
          }
        }

        const mapped = mapLegacyToErp(type, status);

        const shouldApply = shouldApplyInventory(type, status);

        if (shouldApply) {
          for (const line of items) {
            const alreadyApplied =
              type === "SALE" ? line.dispatchedQty : line.receivedQty;
            const delta = Math.max(0, line.quantity - alreadyApplied);
            if (delta === 0) {
              continue;
            }

            await applyInventoryChangeWithTx(tx, {
              productCode: line.sku,
              type: type === "SALE" ? "SALE" : "PURCHASE",
              quantity: delta,
              referenceId: orderId
            });

            await tx
              .update(erpOrderItems)
              .set(
                type === "SALE"
                  ? { dispatchedQty: line.quantity, updatedAt: new Date() }
                  : { receivedQty: line.quantity, updatedAt: new Date() }
              )
              .where(eq(erpOrderItems.id, line.id));
          }
        }

        const [updatedOrderRow] = await tx
          .update(erpOrders)
          .set({
            status: mapped.status,
            paymentStatus: mapped.paymentStatus,
            version: existingOrder.version + 1,
            updatedAt: new Date()
          })
          .where(and(eq(erpOrders.id, orderId), eq(erpOrders.version, existingOrder.version)))
          .returning({ id: erpOrders.id, type: erpOrders.type, status: erpOrders.status });

        if (!updatedOrderRow) {
          throw new AppError("Concurrent transition detected", 409, "CONFLICT", {
            orderId,
            expectedVersion: existingOrder.version
          });
        }

        await tx.insert(erpOrderEvents).values({
          orderId,
          action: "COMPAT_STATUS_CHANGED",
          actor: context?.performedBy ?? "system",
          metadata: {
            toStatus: status,
            erpStatus: mapped.status,
            erpPaymentStatus: mapped.paymentStatus
          }
        });

        await transitionLogsService.logTransition({
          entityType: existingOrder.type === "SALE" ? "sales" : "purchase",
          entityId: orderId,
          previousState: existingOrder.status,
          newState: mapped.status,
          performedBy: context?.performedBy ?? "system",
          action: "COMPAT_STATUS_CHANGED",
          idempotencyKey: context?.idempotencyKey,
          metadata: {
            legacyStatus: status,
            requestId: context?.requestId,
            paymentStatus: mapped.paymentStatus
          }
        }, tx);

        const updatedOrder = await readCompatOrder(orderId, tx);

        emitOrderUpdate({
          orderId: updatedOrder.id,
          type: updatedOrder.type as OrderType,
          status: updatedOrder.status
        });

        logger.info("Compat order status transition", {
          orderId,
          from: existingOrder.status,
          to: mapped.status,
          actor: context?.performedBy ?? "system",
          requestId: context?.requestId
        });

        return updatedOrder;
      });
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw mapDatabaseError(error, "Failed to update order status");
    }
  },

  async deleteOrder(orderId: string) {
    const [deleted] = await db
      .delete(erpOrders)
      .where(eq(erpOrders.id, orderId))
      .returning({ orderId: erpOrders.id, type: erpOrders.type, status: erpOrders.status });

    if (!deleted) {
      throw new AppError("Order not found", 404, "NOT_FOUND", { orderId });
    }

    return deleted;
  }
};
