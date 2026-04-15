import { and, asc, desc, eq, ilike, inArray, or, sql } from "drizzle-orm";
import { AppError, mapDatabaseError } from "../../common/errors/AppError";
import { emitOrderCreated, emitOrderStatusChanged, emitOrderUpdate } from "../../common/socket";
import { ALLOWED_TRANSITIONS } from "../../common/constants/states";
import { db } from "../../db";
import {
  ErpOrder,
  erpOrderEvents,
  erpOrderItems,
  erpOrders,
  products
} from "../../db/schema";
import { applyInventoryChangeWithTx } from "../inventory/inventory.service";
import { transitionLogsService } from "../transitionLogs/transitionLogs.service";

export type ErpOrderType = "SALE" | "PURCHASE";
export type ErpOrderStatus =
  | "DRAFT"
  | "QUOTATION"
  | "APPROVED"
  | "PACKING"
  | "DISPATCHED"
  | "COMPLETED"
  | "ON_HOLD"
  | "CANCELLED";
export type ErpPaymentStatus = "UNPAID" | "PARTIALLY_PAID" | "PAID" | "REFUNDED";

type CreateItemInput = {
  productCode: string;
  quantity: number;
  unitPrice: number;
  discountAmount?: number;
  taxRate?: number;
};

type CreateOrderInput = {
  type: ErpOrderType;
  customerId?: string;
  supplierId?: string;
  addressId?: string;
  paymentTerms?: string;
  owner?: string;
  notes?: string;
  status?: ErpOrderStatus;
  paymentStatus?: ErpPaymentStatus;
  discountAmount?: number;
  freightCharges?: number;
  packingCharges?: number;
  deliveryDate?: string;
  isDraft?: boolean;
  idempotencyKey?: string;
  items: CreateItemInput[];
};

type ReplaceItemsInput = {
  items: CreateItemInput[];
};

type TransitionInput = {
  toStatus: ErpOrderStatus;
  actor?: string;
  remarks?: string;
};

const toMoney = (value: number | undefined) => {
  const safe = Number.isFinite(value) ? (value as number) : 0;
  return safe.toFixed(2);
};

const parseMoney = (value: unknown) => {
  if (typeof value === "number") {
    return value;
  }
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
};

const makeOrderNumber = (type: ErpOrderType) => {
  const prefix = type === "SALE" ? "SO" : "PO";
  const now = new Date();
  const yyyymmdd = now.toISOString().slice(0, 10).replaceAll("-", "");
  const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `${prefix}-${yyyymmdd}-${rand}`;
};

const toOrderResponse = (order: ErpOrder) => ({
  ...order,
  subtotalAmount: parseMoney(order.subtotalAmount),
  discountAmount: parseMoney(order.discountAmount),
  freightCharges: parseMoney(order.freightCharges),
  packingCharges: parseMoney(order.packingCharges),
  taxAmount: parseMoney(order.taxAmount),
  grandTotal: parseMoney(order.grandTotal)
});

export const omsService = {
  async createOrder(input: CreateOrderInput) {
    if (input.type === "SALE" && !input.customerId) {
      throw new AppError("customerId is required for sale order", 400, "VALIDATION_ERROR");
    }

    if (input.type === "PURCHASE" && !input.supplierId) {
      throw new AppError("supplierId is required for purchase order", 400, "VALIDATION_ERROR");
    }

    if (!input.items.length) {
      throw new AppError("At least one order item is required", 400, "VALIDATION_ERROR");
    }

    try {
      const createdOrderId = await db.transaction(async (tx) => {
        if (input.idempotencyKey) {
          const [existingByIdem] = await tx
            .select()
            .from(erpOrders)
            .where(eq(erpOrders.idempotencyKey, input.idempotencyKey))
            .limit(1);
          if (existingByIdem) {
            return existingByIdem.id;
          }
        }

        const requestedCodes = input.items.map((item) => item.productCode);
        const productRows = await tx
          .select({
            id: products.id,
            productCode: products.productCode,
            name: products.name,
            price: products.price
          })
          .from(products)
          .where(inArray(products.productCode, requestedCodes));

        if (productRows.length !== requestedCodes.length) {
          const found = new Set(productRows.map((row) => row.productCode));
          const missing = requestedCodes.filter((code) => !found.has(code));
          throw new AppError("Some products do not exist", 400, "VALIDATION_ERROR", { missing });
        }

        const byCode = new Map(productRows.map((row) => [row.productCode, row]));

        const itemsWithTotals = input.items.map((item, index) => {
          const product = byCode.get(item.productCode);
          if (!product) {
            throw new AppError("Product not found", 400, "VALIDATION_ERROR", {
              productCode: item.productCode
            });
          }

          const unitPrice = Number.isFinite(item.unitPrice) ? item.unitPrice : parseMoney(product.price);
          const qty = Math.max(1, Math.trunc(item.quantity));
          const discountAmount = Number.isFinite(item.discountAmount) ? Math.max(0, item.discountAmount ?? 0) : 0;
          const taxRate = Number.isFinite(item.taxRate) ? Math.max(0, item.taxRate ?? 0) : 0;
          const subtotal = qty * unitPrice - discountAmount;
          const taxAmount = subtotal * (taxRate / 100);
          const lineTotal = subtotal + taxAmount;

          return {
            lineNumber: index + 1,
            productId: product.id,
            sku: product.productCode,
            name: product.name,
            quantity: qty,
            unitPrice,
            discountAmount,
            taxRate,
            taxAmount,
            lineTotal
          };
        });

        const subtotalAmount = itemsWithTotals.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
        const lineDiscountAmount = itemsWithTotals.reduce((sum, item) => sum + item.discountAmount, 0);
        const lineTaxAmount = itemsWithTotals.reduce((sum, item) => sum + item.taxAmount, 0);
        const headerDiscount = Math.max(0, input.discountAmount ?? 0);
        const freight = Math.max(0, input.freightCharges ?? 0);
        const packing = Math.max(0, input.packingCharges ?? 0);
        const taxAmount = lineTaxAmount;
        const grandTotal = subtotalAmount - lineDiscountAmount - headerDiscount + freight + packing + taxAmount;

        const [createdOrder] = await tx
          .insert(erpOrders)
          .values({
            orderNumber: makeOrderNumber(input.type),
            type: input.type,
            customerId: input.customerId,
            supplierId: input.supplierId,
            addressId: input.addressId,
            status: input.status ?? (input.isDraft ? "DRAFT" : "QUOTATION"),
            paymentStatus: input.paymentStatus ?? "UNPAID",
            subtotalAmount: toMoney(subtotalAmount),
            discountAmount: toMoney(lineDiscountAmount + headerDiscount),
            freightCharges: toMoney(freight),
            packingCharges: toMoney(packing),
            taxAmount: toMoney(taxAmount),
            grandTotal: toMoney(grandTotal),
            paymentTerms: input.paymentTerms,
            owner: input.owner,
            notes: input.notes,
            isDraft: input.isDraft ?? true,
            idempotencyKey: input.idempotencyKey,
            deliveryDate: input.deliveryDate ? new Date(input.deliveryDate) : null
          })
          .returning();

        await tx.insert(erpOrderItems).values(
          itemsWithTotals.map((item) => ({
            orderId: createdOrder.id,
            lineNumber: item.lineNumber,
            productId: item.productId,
            sku: item.sku,
            name: item.name,
            quantity: item.quantity,
            unitPrice: toMoney(item.unitPrice),
            discountAmount: toMoney(item.discountAmount),
            taxRate: toMoney(item.taxRate),
            taxAmount: toMoney(item.taxAmount),
            lineTotal: toMoney(item.lineTotal)
          }))
        );

        await tx.insert(erpOrderEvents).values({
          orderId: createdOrder.id,
          action: "CREATED",
          actor: input.owner ?? "system",
          metadata: {
            status: createdOrder.status,
            type: createdOrder.type,
            itemCount: itemsWithTotals.length
          }
        });

        emitOrderCreated({
          orderId: createdOrder.id,
          orderNumber: createdOrder.orderNumber,
          type: createdOrder.type,
          status: createdOrder.status
        });

        emitOrderUpdate({
          orderId: createdOrder.id,
          type: createdOrder.type,
          status: createdOrder.status
        });

        return createdOrder.id;
      });

      return this.getById(createdOrderId);
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw mapDatabaseError(error, "Failed to create ERP order");
    }
  },

  async list(input: {
    page: number;
    pageSize: number;
    type?: ErpOrderType;
    status?: ErpOrderStatus;
    paymentStatus?: ErpPaymentStatus;
    search?: string;
    sortBy?: "createdAt" | "updatedAt" | "grandTotal";
    sortDirection?: "asc" | "desc";
  }) {
    const whereClauses = [];

    if (input.type) {
      whereClauses.push(eq(erpOrders.type, input.type));
    }
    if (input.status) {
      whereClauses.push(eq(erpOrders.status, input.status));
    }
    if (input.paymentStatus) {
      whereClauses.push(eq(erpOrders.paymentStatus, input.paymentStatus));
    }
    if (input.search) {
      whereClauses.push(
        or(
          ilike(erpOrders.orderNumber, `%${input.search}%`),
          ilike(erpOrders.owner, `%${input.search}%`),
          ilike(erpOrders.notes, `%${input.search}%`)
        )
      );
    }

    const where = whereClauses.length ? and(...whereClauses) : undefined;

    const [countRow] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(erpOrders)
      .where(where ?? sql`true`);

    const sortBy = input.sortBy ?? "createdAt";
    const sortDirection = input.sortDirection ?? "desc";
    const sortColumn =
      sortBy === "updatedAt"
        ? erpOrders.updatedAt
        : sortBy === "grandTotal"
          ? erpOrders.grandTotal
          : erpOrders.createdAt;

    const rows = await db
      .select()
      .from(erpOrders)
      .where(where ?? sql`true`)
      .orderBy(sortDirection === "asc" ? asc(sortColumn) : desc(sortColumn))
      .limit(input.pageSize)
      .offset((input.page - 1) * input.pageSize);

    return {
      page: input.page,
      pageSize: input.pageSize,
      total: countRow?.count ?? 0,
      data: rows.map(toOrderResponse)
    };
  },

  async getById(id: string) {
    const [order] = await db.select().from(erpOrders).where(eq(erpOrders.id, id)).limit(1);
    if (!order) {
      throw new AppError("ERP order not found", 404, "NOT_FOUND", { id });
    }

    const [items, events] = await Promise.all([
      db.select().from(erpOrderItems).where(eq(erpOrderItems.orderId, id)).orderBy(asc(erpOrderItems.lineNumber)),
      db.select().from(erpOrderEvents).where(eq(erpOrderEvents.orderId, id)).orderBy(desc(erpOrderEvents.createdAt))
    ]);

    return {
      ...toOrderResponse(order),
      items: items.map((item) => ({
        ...item,
        unitPrice: parseMoney(item.unitPrice),
        discountAmount: parseMoney(item.discountAmount),
        taxRate: parseMoney(item.taxRate),
        taxAmount: parseMoney(item.taxAmount),
        lineTotal: parseMoney(item.lineTotal)
      })),
      events
    };
  },

  async replaceItems(orderId: string, input: ReplaceItemsInput) {
    if (!input.items.length) {
      throw new AppError("At least one order item is required", 400, "VALIDATION_ERROR");
    }

    const updatedOrderId = await db.transaction(async (tx) => {
      const [order] = await tx.select().from(erpOrders).where(eq(erpOrders.id, orderId)).limit(1);
      if (!order) {
        throw new AppError("ERP order not found", 404, "NOT_FOUND", { orderId });
      }

      if (!["DRAFT", "QUOTATION", "APPROVED"].includes(order.status)) {
        throw new AppError("Order items cannot be modified at current status", 409, "CONFLICT", {
          status: order.status
        });
      }

      const requestedCodes = input.items.map((item) => item.productCode);
      const productRows = await tx
        .select({ id: products.id, productCode: products.productCode, name: products.name, price: products.price })
        .from(products)
        .where(inArray(products.productCode, requestedCodes));

      if (productRows.length !== requestedCodes.length) {
        throw new AppError("Some products do not exist", 400, "VALIDATION_ERROR");
      }

      const byCode = new Map(productRows.map((row) => [row.productCode, row]));

      const normalized = input.items.map((item, index) => {
        const product = byCode.get(item.productCode);
        if (!product) {
          throw new AppError("Product not found", 400, "VALIDATION_ERROR", {
            productCode: item.productCode
          });
        }

        const quantity = Math.max(1, Math.trunc(item.quantity));
        const unitPrice = Number.isFinite(item.unitPrice) ? item.unitPrice : parseMoney(product.price);
        const discountAmount = Math.max(0, item.discountAmount ?? 0);
        const taxRate = Math.max(0, item.taxRate ?? 0);
        const lineSubtotal = quantity * unitPrice - discountAmount;
        const taxAmount = lineSubtotal * (taxRate / 100);

        return {
          lineNumber: index + 1,
          productId: product.id,
          sku: product.productCode,
          name: product.name,
          quantity,
          unitPrice,
          discountAmount,
          taxRate,
          taxAmount,
          lineTotal: lineSubtotal + taxAmount
        };
      });

      const subtotalAmount = normalized.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
      const discountAmount = normalized.reduce((sum, item) => sum + item.discountAmount, 0);
      const taxAmount = normalized.reduce((sum, item) => sum + item.taxAmount, 0);
      const grandTotal = subtotalAmount - discountAmount + parseMoney(order.freightCharges) + parseMoney(order.packingCharges) + taxAmount;

      await tx.delete(erpOrderItems).where(eq(erpOrderItems.orderId, orderId));
      await tx.insert(erpOrderItems).values(
        normalized.map((item) => ({
          orderId,
          lineNumber: item.lineNumber,
          productId: item.productId,
          sku: item.sku,
          name: item.name,
          quantity: item.quantity,
          unitPrice: toMoney(item.unitPrice),
          discountAmount: toMoney(item.discountAmount),
          taxRate: toMoney(item.taxRate),
          taxAmount: toMoney(item.taxAmount),
          lineTotal: toMoney(item.lineTotal)
        }))
      );

      await tx
        .update(erpOrders)
        .set({
          subtotalAmount: toMoney(subtotalAmount),
          discountAmount: toMoney(discountAmount),
          taxAmount: toMoney(taxAmount),
          grandTotal: toMoney(grandTotal),
          version: order.version + 1,
          updatedAt: new Date()
        })
        .where(eq(erpOrders.id, orderId));

      await tx.insert(erpOrderEvents).values({
        orderId,
        action: "ITEMS_REPLACED",
        actor: "system",
        metadata: { itemCount: normalized.length }
      });

      return orderId;
    });

    return this.getById(updatedOrderId);
  },

  async transitionStatus(orderId: string, input: TransitionInput) {
    try {
      const updatedOrderId = await db.transaction(async (tx) => {
        const [order] = await tx.select().from(erpOrders).where(eq(erpOrders.id, orderId)).limit(1);
        if (!order) {
          throw new AppError("ERP order not found", 404, "NOT_FOUND", { orderId });
        }

        const allowed = ALLOWED_TRANSITIONS[order.status];
        if (!allowed.includes(input.toStatus)) {
          throw new AppError("Invalid state transition", 409, "CONFLICT", {
            from: order.status,
            to: input.toStatus,
            allowed
          });
        }

        const items = await tx.select().from(erpOrderItems).where(eq(erpOrderItems.orderId, orderId));

        if (order.type === "SALE" && input.toStatus === "DISPATCHED") {
          for (const item of items) {
            const delta = Math.max(0, item.quantity - item.dispatchedQty);
            if (delta > 0) {
              await applyInventoryChangeWithTx(tx, {
                productCode: item.sku,
                type: "SALE",
                quantity: delta,
                referenceId: orderId
              });

              await tx
                .update(erpOrderItems)
                .set({ dispatchedQty: item.quantity, updatedAt: new Date() })
                .where(eq(erpOrderItems.id, item.id));
            }
          }
        }

        if (order.type === "PURCHASE" && input.toStatus === "COMPLETED") {
          for (const item of items) {
            const delta = Math.max(0, item.quantity - item.receivedQty);
            if (delta > 0) {
              await applyInventoryChangeWithTx(tx, {
                productCode: item.sku,
                type: "PURCHASE",
                quantity: delta,
                referenceId: orderId
              });

              await tx
                .update(erpOrderItems)
                .set({ receivedQty: item.quantity, updatedAt: new Date() })
                .where(eq(erpOrderItems.id, item.id));
            }
          }
        }

        const [updated] = await tx
          .update(erpOrders)
          .set({
            status: input.toStatus,
            isDraft: input.toStatus === "DRAFT",
            version: order.version + 1,
            updatedAt: new Date()
          })
          .where(and(eq(erpOrders.id, orderId), eq(erpOrders.version, order.version)))
          .returning();

        if (!updated) {
          throw new AppError("Concurrent transition detected", 409, "CONFLICT", {
            orderId,
            expectedVersion: order.version
          });
        }

        await tx.insert(erpOrderEvents).values({
          orderId,
          action: "STATUS_CHANGED",
          actor: input.actor ?? "system",
          remarks: input.remarks,
          metadata: {
            from: order.status,
            to: input.toStatus
          }
        });

        emitOrderStatusChanged({
          orderId,
          type: updated.type,
          fromStatus: order.status,
          toStatus: updated.status
        });

        await transitionLogsService.logTransition({
          entityType: order.type === "SALE" ? "sales" : "purchase",
          entityId: orderId,
          previousState: order.status,
          newState: updated.status,
          performedBy: input.actor ?? "system",
          action: "STATUS_CHANGED",
          metadata: {
            remarks: input.remarks
          }
        }, tx);

        emitOrderUpdate({
          orderId,
          type: updated.type,
          status: updated.status
        });

        return orderId;
      });

      return this.getById(updatedOrderId);
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw mapDatabaseError(error, "Failed to transition order status");
    }
  }
};
