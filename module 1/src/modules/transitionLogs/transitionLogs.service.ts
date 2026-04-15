import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "../../db";
import { transitionLogs } from "../../db/schema";

type TransitionLogExecutor = Pick<typeof db, "select" | "insert">;

type LogTransitionInput = {
  entityType: "manufacturing" | "sales" | "purchase";
  entityId: string;
  previousState: string;
  newState: string;
  performedBy: string;
  action: string;
  metadata?: Record<string, unknown>;
  idempotencyKey?: string;
};

export const transitionLogsService = {
  async logTransition(input: LogTransitionInput, executor: TransitionLogExecutor = db) {
    if (input.idempotencyKey) {
      const [existing] = await executor
        .select()
        .from(transitionLogs)
        .where(
          and(
            eq(transitionLogs.entityType, input.entityType),
            eq(transitionLogs.entityId, input.entityId),
            eq(transitionLogs.action, input.action),
            eq(transitionLogs.idempotencyKey, input.idempotencyKey)
          )
        )
        .limit(1);

      if (existing) {
        return existing;
      }
    }

    const [created] = await executor
      .insert(transitionLogs)
      .values({
        entityType: input.entityType,
        entityId: input.entityId,
        previousState: input.previousState,
        newState: input.newState,
        performedBy: input.performedBy,
        action: input.action,
        metadata: input.metadata ?? {},
        idempotencyKey: input.idempotencyKey
      })
      .returning();

    return created;
  },

  async list(input: {
    entityType?: "manufacturing" | "sales" | "purchase";
    entityId?: string;
    page: number;
    pageSize: number;
  }) {
    const whereClauses = [];
    if (input.entityType) {
      whereClauses.push(eq(transitionLogs.entityType, input.entityType));
    }
    if (input.entityId) {
      whereClauses.push(eq(transitionLogs.entityId, input.entityId));
    }

    const where = whereClauses.length ? and(...whereClauses) : undefined;

    const [countRow] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(transitionLogs)
      .where(where ?? sql`true`);

    const rows = await db
      .select()
      .from(transitionLogs)
      .where(where ?? sql`true`)
      .orderBy(desc(transitionLogs.createdAt))
      .limit(input.pageSize)
      .offset((input.page - 1) * input.pageSize);

    return {
      page: input.page,
      pageSize: input.pageSize,
      total: countRow?.count ?? 0,
      data: rows
    };
  }
};