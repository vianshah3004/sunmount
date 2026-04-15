import { and, eq, gte, sql } from "drizzle-orm";
import { AppError, isAppError, mapDatabaseError } from "../../common/errors/AppError";
import { emitInventoryUpdate, emitLowStock } from "../../common/socket";
import { logger } from "../../common/logger";
import { db } from "../../db";
import { inventoryLogs, products } from "../../db/schema";

export type InventoryChangeType = "SALE" | "PURCHASE" | "WIP_RAW" | "WIP_OUTPUT";

export type UpdateInventoryInput = {
  productCode: string;
  type: InventoryChangeType;
  quantity: number;
  referenceId?: string;
};

const DECREMENT_TYPES: InventoryChangeType[] = ["SALE", "WIP_RAW"];

type TxLike = any;

export const applyInventoryChangeWithTx = async (
  tx: TxLike,
  { productCode, type, quantity, referenceId }: UpdateInventoryInput
) => {
  if (quantity <= 0) {
    throw new AppError("Quantity must be greater than zero", 400, "VALIDATION_ERROR", {
      quantity
    });
  }

  const isDecrement = DECREMENT_TYPES.includes(type);

  const updateQuery = tx
    .update(products)
    .set({
      quantity: isDecrement
        ? sql`${products.quantity} - ${quantity}`
        : sql`${products.quantity} + ${quantity}`,
      updatedAt: sql`now()`
    })
    .where(
      isDecrement
        ? and(eq(products.productCode, productCode), gte(products.quantity, quantity))
        : eq(products.productCode, productCode)
    )
    .returning({
      id: products.id,
      productCode: products.productCode,
      quantity: products.quantity,
      lowStockThreshold: products.lowStockThreshold
    });

  const [updatedProduct] = await updateQuery;

  if (!updatedProduct) {
    const [existingProduct] = await tx
      .select({ id: products.id, quantity: products.quantity })
      .from(products)
      .where(eq(products.productCode, productCode))
      .limit(1);

    if (!existingProduct) {
      throw new AppError("Product not found", 404, "NOT_FOUND", {
        productCode
      });
    }

    throw new AppError("Insufficient stock for this operation", 400, "INSUFFICIENT_STOCK", {
      productCode,
      quantity,
      availableQuantity: existingProduct.quantity
    });
  }

  await tx.insert(inventoryLogs).values({
    productId: updatedProduct.id,
    changeType: type,
    quantity,
    referenceId
  });

  emitInventoryUpdate({
    productCode: updatedProduct.productCode,
    newQuantity: updatedProduct.quantity
  });

  if (updatedProduct.quantity < updatedProduct.lowStockThreshold) {
    logger.warn("Low stock alert", {
      productCode: updatedProduct.productCode,
      quantity: updatedProduct.quantity,
      lowStockThreshold: updatedProduct.lowStockThreshold
    });

    emitLowStock({
      productCode: updatedProduct.productCode,
      quantity: updatedProduct.quantity,
      lowStockThreshold: updatedProduct.lowStockThreshold
    });
  }

  return {
    productCode: updatedProduct.productCode,
    newQuantity: updatedProduct.quantity,
    changeType: type,
    referenceId: referenceId ?? null
  };
};

export const inventoryService = {
  async updateInventory({
    productCode,
    type,
    quantity,
    referenceId
  }: UpdateInventoryInput) {
    try {
      return await db.transaction(async (tx) => {
        return applyInventoryChangeWithTx(tx, {
          productCode,
          type,
          quantity,
          referenceId
        });
      });
    } catch (error) {
      logger.error("DB error while updating inventory", {
        error,
        productCode,
        type,
        quantity,
        referenceId
      });
      if (isAppError(error)) {
        throw error;
      }
      throw mapDatabaseError(error, "Failed to update inventory");
    }
  }
};
