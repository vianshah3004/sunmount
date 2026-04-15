import { desc, eq, sql } from "drizzle-orm";
import { AppError, mapDatabaseError } from "../../common/errors/AppError";
import { logger } from "../../common/logger";
import { toManufacturingView } from "../../common/presenters";
import { emitManufacturingUpdate } from "../../common/socket";
import { db } from "../../db";
import { ManufacturingLineItem, manufacturingBatches } from "../../db/schema";
import { applyInventoryChangeWithTx } from "../inventory/inventory.service";
import { transitionLogsService } from "../transitionLogs/transitionLogs.service";

export type ManufacturingStatus = "IN_PROGRESS" | "COMPLETED" | "CANCELLED";

export const manufacturingService = {
  async createBatch(input: {
    batchNumber: string;
    rawMaterials: ManufacturingLineItem[];
    outputProducts: ManufacturingLineItem[];
    status?: ManufacturingStatus;
    notes?: string;
  }) {
    try {
      const [batch] = await db
        .insert(manufacturingBatches)
        .values({
          batchNumber: input.batchNumber,
          rawMaterials: input.rawMaterials,
          outputProducts: input.outputProducts,
          status: input.status ?? "IN_PROGRESS",
          notes: input.notes
        })
        .returning();

      emitManufacturingUpdate({
        batchNumber: batch.batchNumber,
        status: batch.status
      });

      return toManufacturingView(batch);
    } catch (error) {
      throw mapDatabaseError(error, "Failed to create manufacturing batch");
    }
  },

  async listBatches(page: number, pageSize: number, status?: ManufacturingStatus) {
    const where = status ? eq(manufacturingBatches.status, status) : undefined;

    const [countRow] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(manufacturingBatches)
      .where(where ?? sql`true`);

    const rows = await db
      .select()
      .from(manufacturingBatches)
      .where(where ?? sql`true`)
      .orderBy(desc(manufacturingBatches.createdAt))
      .limit(pageSize)
      .offset((page - 1) * pageSize);

    const data = rows.map(toManufacturingView).map((row) => ({
      id: row.id,
      batchNumber: row.batchNumber,
      progress: row.progress,
      rawMaterialsCount: row.rawMaterialsCount,
      outputCount: row.outputCount,
      statusLabel: row.statusLabel,
      statusColor: row.statusColor,
      startDate: row.startDate,
      endDate: row.endDate,
      updatedAt: row.updatedAt
    }));

    return {
      page,
      pageSize,
      total: countRow?.count ?? 0,
      data
    };
  },

  async getBatchById(batchId: string) {
    const [batch] = await db
      .select()
      .from(manufacturingBatches)
      .where(eq(manufacturingBatches.batchNumber, batchId))
      .limit(1);

    if (!batch) {
      throw new AppError("Manufacturing batch not found", 404, "NOT_FOUND", { batchId });
    }

    return toManufacturingView(batch);
  },

  async startWIP(
    batchId: string,
    context?: {
      performedBy?: string;
      idempotencyKey?: string;
      requestId?: string;
    }
  ) {
    try {
      return await db.transaction(async (tx) => {
        // Row-level lock prevents double-start races under concurrent requests.
        await tx.execute(
          sql`select batch_number from manufacturing_batches where batch_number = ${batchId} for update`
        );

        const [batch] = await tx
          .select()
          .from(manufacturingBatches)
          .where(eq(manufacturingBatches.batchNumber, batchId))
          .limit(1);

        if (!batch) {
          throw new AppError("Manufacturing batch not found", 404, "NOT_FOUND", { batchId });
        }

        if (batch.status === "COMPLETED" || batch.status === "CANCELLED") {
          throw new AppError("Only in-progress batches can be started", 409, "CONFLICT", {
            batchId,
            status: batch.status
          });
        }

        if (batch.materialConsumed) {
          return toManufacturingView(batch);
        }

        // Deduct raw materials at start
        for (const line of batch.rawMaterials) {
          await applyInventoryChangeWithTx(tx, {
            productCode: line.productCode,
            type: "WIP_RAW",
            quantity: line.quantity,
            referenceId: batchId
          });
        }

        const [updatedBatch] = await tx
          .update(manufacturingBatches)
          .set({
            status: "IN_PROGRESS",
            materialConsumed: true,
            startDate: new Date(),
            updatedAt: new Date()
          })
          .where(eq(manufacturingBatches.batchNumber, batchId))
          .returning();

        await transitionLogsService.logTransition({
          entityType: "manufacturing",
          entityId: batchId,
          previousState: batch.status,
          newState: updatedBatch.status,
          performedBy: context?.performedBy ?? "system",
          action: "START",
          idempotencyKey: context?.idempotencyKey,
          metadata: {
            requestId: context?.requestId,
            materialConsumed: true
          }
        }, tx);

        emitManufacturingUpdate({
          batchNumber: updatedBatch.batchNumber,
          status: updatedBatch.status
        });

        logger.info("Manufacturing batch started", {
          batchId,
          actor: context?.performedBy ?? "system",
          requestId: context?.requestId
        });

        return toManufacturingView(updatedBatch);
      });
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw mapDatabaseError(error, "Failed to start manufacturing batch");
    }
  },

  async completeProduction(
    batchId: string,
    context?: {
      performedBy?: string;
      idempotencyKey?: string;
      requestId?: string;
    }
  ) {
    try {
      return await db.transaction(async (tx) => {
        await tx.execute(
          sql`select batch_number from manufacturing_batches where batch_number = ${batchId} for update`
        );

        const [batch] = await tx
          .select()
          .from(manufacturingBatches)
          .where(eq(manufacturingBatches.batchNumber, batchId))
          .limit(1);

        if (!batch) {
          throw new AppError("Manufacturing batch not found", 404, "NOT_FOUND", { batchId });
        }

        if (!batch.materialConsumed) {
          throw new AppError("Manufacturing batch must be started before completion", 409, "CONFLICT", { batchId });
        }

        if (batch.status === "CANCELLED") {
          throw new AppError("Cancelled batch cannot be completed", 409, "CONFLICT", {
            batchId,
            status: batch.status
          });
        }

        if (batch.outputAdded) {
          return toManufacturingView(batch);
        }

        // Add output only at completion (raw materials already deducted at start)
        for (const line of batch.outputProducts) {
          await applyInventoryChangeWithTx(tx, {
            productCode: line.productCode,
            type: "WIP_OUTPUT",
            quantity: line.quantity,
            referenceId: batchId
          });
        }

        const [updatedBatch] = await tx
          .update(manufacturingBatches)
          .set({
            status: "COMPLETED",
            outputAdded: true,
            endDate: new Date(),
            updatedAt: new Date()
          })
          .where(eq(manufacturingBatches.batchNumber, batchId))
          .returning();

        await transitionLogsService.logTransition({
          entityType: "manufacturing",
          entityId: batchId,
          previousState: batch.status,
          newState: updatedBatch.status,
          performedBy: context?.performedBy ?? "system",
          action: "COMPLETE",
          idempotencyKey: context?.idempotencyKey,
          metadata: {
            requestId: context?.requestId,
            outputAdded: true
          }
        }, tx);

        emitManufacturingUpdate({
          batchNumber: updatedBatch.batchNumber,
          status: updatedBatch.status
        });

        logger.info("Manufacturing batch completed", {
          batchId,
          actor: context?.performedBy ?? "system",
          requestId: context?.requestId
        });

        return toManufacturingView(updatedBatch);
      });
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw mapDatabaseError(error, "Failed to complete manufacturing batch");
    }
  },

  async updateStatus(batchId: string, status: ManufacturingStatus) {
    const [batch] = await db
      .update(manufacturingBatches)
      .set({
        status,
        updatedAt: new Date()
      })
      .where(eq(manufacturingBatches.batchNumber, batchId))
      .returning();

    if (!batch) {
      throw new AppError("Manufacturing batch not found", 404, "NOT_FOUND", { batchId });
    }

    emitManufacturingUpdate({
      batchNumber: batch.batchNumber,
      status: batch.status
    });

    return toManufacturingView(batch);
  },

  async updateBatch(
    batchId: string,
    input: { rawMaterials?: ManufacturingLineItem[]; outputProducts?: ManufacturingLineItem[]; notes?: string }
  ) {
    const [batch] = await db
      .update(manufacturingBatches)
      .set({
        ...(input.rawMaterials ? { rawMaterials: input.rawMaterials } : {}),
        ...(input.outputProducts ? { outputProducts: input.outputProducts } : {}),
        ...(input.notes !== undefined ? { notes: input.notes } : {}),
        updatedAt: new Date()
      })
      .where(eq(manufacturingBatches.batchNumber, batchId))
      .returning();

    if (!batch) {
      throw new AppError("Manufacturing batch not found", 404, "NOT_FOUND", { batchId });
    }

    return toManufacturingView(batch);
  },

  async deleteBatch(batchId: string) {
    const [batch] = await db
      .delete(manufacturingBatches)
      .where(eq(manufacturingBatches.batchNumber, batchId))
      .returning({ batchNumber: manufacturingBatches.batchNumber });

    if (!batch) {
      throw new AppError("Manufacturing batch not found", 404, "NOT_FOUND", { batchId });
    }

    return batch;
  },

  // Backward compatible aliases for existing callers.
  async startBatch(
    batchId: string,
    context?: {
      performedBy?: string;
      idempotencyKey?: string;
      requestId?: string;
    }
  ) {
    return this.startWIP(batchId, context);
  },

  async completeBatch(
    batchId: string,
    context?: {
      performedBy?: string;
      idempotencyKey?: string;
      requestId?: string;
    }
  ) {
    return this.completeProduction(batchId, context);
  }
};
