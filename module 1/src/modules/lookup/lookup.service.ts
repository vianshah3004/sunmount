import { and, desc, eq, ilike, sql } from "drizzle-orm";
import { db } from "../../db";
import { erpOrders, products } from "../../db/schema";

export const lookupService = {
  async products(query: string) {
    const rows = await db
      .select({
        id: products.id,
        sku: products.productCode,
        name: products.name,
        price: products.price,
        stock: products.quantity
      })
      .from(products)
      .where(
        query
          ? sql`${products.productCode} ilike ${`%${query}%`} or ${products.name} ilike ${`%${query}%`}`
          : sql`true`
      )
      .orderBy(desc(products.updatedAt))
      .limit(20);

    return rows.map((item) => ({
      id: item.id,
      label: `${item.name} (${item.sku})`,
      extra: {
        price: Number(item.price),
        stock: item.stock
      }
    }));
  },

  async parties(type: "SALE" | "PURCHASE", query: string) {
    const rows = await db
      .select({ id: erpOrders.owner, label: erpOrders.owner })
      .from(erpOrders)
      .where(
        and(
          eq(erpOrders.type, type),
          sql`${erpOrders.owner} is not null`,
          query ? ilike(erpOrders.owner, `%${query}%`) : sql`true`
        )
      )
      .groupBy(erpOrders.owner)
      .orderBy(desc(sql`max(${erpOrders.createdAt})`))
      .limit(20);

    return rows.map((item) => ({
      id: item.id!,
      label: `${item.label!} (${type === "SALE" ? "Customer" : "Supplier"})`,
      extra: {}
    }));
  }
};
