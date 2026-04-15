import { and, desc, eq, gte, lte, or, sql } from "drizzle-orm";
import { db } from "../../db";
import { inventoryLogs, products } from "../../db/schema";

export type HistoryType = "sale" | "purchase" | "manufacturing";

const buildWhereClause = (filters: {
  type?: HistoryType;
  fromDate?: Date;
  toDate?: Date;
  productCode?: string;
}) => {
  const whereClauses = [];

  if (filters.type === "sale") {
    whereClauses.push(eq(inventoryLogs.changeType, "SALE"));
  } else if (filters.type === "purchase") {
    whereClauses.push(eq(inventoryLogs.changeType, "PURCHASE"));
  } else if (filters.type === "manufacturing") {
    whereClauses.push(or(eq(inventoryLogs.changeType, "WIP_RAW"), eq(inventoryLogs.changeType, "WIP_OUTPUT")));
  }

  if (filters.productCode) {
    whereClauses.push(eq(products.productCode, filters.productCode));
  }

  if (filters.fromDate) {
    whereClauses.push(gte(inventoryLogs.createdAt, filters.fromDate));
  }

  if (filters.toDate) {
    whereClauses.push(lte(inventoryLogs.createdAt, filters.toDate));
  }

  return whereClauses.length > 0 ? and(...whereClauses) : undefined;
};

export const historyService = {
  async getHistory(filters: {
    type?: HistoryType;
    fromDate?: Date;
    toDate?: Date;
    productCode?: string;
    page: number;
    pageSize: number;
  }) {
    const where = buildWhereClause(filters);

    const [countRow] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(inventoryLogs)
      .innerJoin(products, eq(products.id, inventoryLogs.productId))
      .where(where ?? sql`true`);

    const data = await db
      .select({
        id: inventoryLogs.id,
        productId: inventoryLogs.productId,
        productCode: products.productCode,
        changeType: inventoryLogs.changeType,
        quantity: inventoryLogs.quantity,
        referenceId: inventoryLogs.referenceId,
        createdAt: inventoryLogs.createdAt
      })
      .from(inventoryLogs)
      .innerJoin(products, eq(products.id, inventoryLogs.productId))
      .where(where ?? sql`true`)
      .orderBy(desc(inventoryLogs.createdAt))
      .limit(filters.pageSize)
      .offset((filters.page - 1) * filters.pageSize);

    return {
      page: filters.page,
      pageSize: filters.pageSize,
      total: countRow?.count ?? 0,
      data,
      export: {
        headers: ["id", "productCode", "changeType", "quantity", "referenceId", "createdAt"],
        rows: data.map((item) => [
          item.id,
          item.productCode,
          item.changeType,
          item.quantity,
          item.referenceId,
          item.createdAt
        ])
      }
    };
  },

  async getHistoryExportRows(filters: {
    type?: HistoryType;
    fromDate?: Date;
    toDate?: Date;
    productCode?: string;
  }) {
    const where = buildWhereClause(filters);

    const data = await db
      .select({
        id: inventoryLogs.id,
        productCode: products.productCode,
        changeType: inventoryLogs.changeType,
        quantity: inventoryLogs.quantity,
        referenceId: inventoryLogs.referenceId,
        createdAt: inventoryLogs.createdAt
      })
      .from(inventoryLogs)
      .innerJoin(products, eq(products.id, inventoryLogs.productId))
      .where(where ?? sql`true`)
      .orderBy(desc(inventoryLogs.createdAt))
      .limit(5000);

    return data.map((item) => ({
      id: item.id,
      productCode: item.productCode,
      changeType: item.changeType,
      quantity: item.quantity,
      referenceId: item.referenceId ?? "",
      createdAt: item.createdAt.toISOString()
    }));
  }
};
