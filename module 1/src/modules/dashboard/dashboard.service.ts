import { sql } from "drizzle-orm";
import { formatInr } from "../../common/ui";
import { db } from "../../db";
import { erpOrders, inventoryLogs, manufacturingBatches, products } from "../../db/schema";

export const dashboardService = {
  async getSummary() {
    const [inventoryValueRow] = await db
      .select({ value: sql<number>`coalesce(sum(${products.price}::numeric * ${products.quantity}), 0)::float` })
      .from(products);

    const [lowStockCount] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(products)
      .where(sql`${products.quantity} <= ${products.lowStockThreshold}`);

    const [pendingOrders] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(erpOrders)
      .where(sql`${erpOrders.status} != 'COMPLETED' and ${erpOrders.status} != 'CANCELLED'`);

    const [wipCount] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(manufacturingBatches)
      .where(sql`${manufacturingBatches.status} = 'IN_PROGRESS'`);

    const [ordersLast7d] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(erpOrders)
      .where(sql`${erpOrders.createdAt} >= now() - interval '7 days'`);

    const [ordersPrev7d] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(erpOrders)
      .where(sql`${erpOrders.createdAt} >= now() - interval '14 days' and ${erpOrders.createdAt} < now() - interval '7 days'`);

    const [wipLast7d] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(manufacturingBatches)
      .where(sql`${manufacturingBatches.createdAt} >= now() - interval '7 days'`);

    const [wipPrev7d] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(manufacturingBatches)
      .where(sql`${manufacturingBatches.createdAt} >= now() - interval '14 days' and ${manufacturingBatches.createdAt} < now() - interval '7 days'`);

    const [inventoryDeltaLast7d] = await db
      .select({
        value: sql<number>`coalesce(sum(case when ${inventoryLogs.changeType} in ('PURCHASE', 'WIP_OUTPUT') then ${inventoryLogs.quantity} * ${products.price}::numeric when ${inventoryLogs.changeType} in ('SALE', 'WIP_RAW') then -1 * ${inventoryLogs.quantity} * ${products.price}::numeric else 0 end), 0)::float`
      })
      .from(inventoryLogs)
      .innerJoin(products, sql`${products.id} = ${inventoryLogs.productId}`)
      .where(sql`${inventoryLogs.createdAt} >= now() - interval '7 days'`);

    const [inventoryDeltaPrev7d] = await db
      .select({
        value: sql<number>`coalesce(sum(case when ${inventoryLogs.changeType} in ('PURCHASE', 'WIP_OUTPUT') then ${inventoryLogs.quantity} * ${products.price}::numeric when ${inventoryLogs.changeType} in ('SALE', 'WIP_RAW') then -1 * ${inventoryLogs.quantity} * ${products.price}::numeric else 0 end), 0)::float`
      })
      .from(inventoryLogs)
      .innerJoin(products, sql`${products.id} = ${inventoryLogs.productId}`)
      .where(sql`${inventoryLogs.createdAt} >= now() - interval '14 days' and ${inventoryLogs.createdAt} < now() - interval '7 days'`);

    const recentActivities = await db
      .select({
        id: inventoryLogs.id,
        type: inventoryLogs.changeType,
        referenceId: inventoryLogs.referenceId,
        productId: inventoryLogs.productId,
        createdAt: inventoryLogs.createdAt,
        quantity: inventoryLogs.quantity,
        productCode: products.productCode,
        productName: products.name
      })
      .from(inventoryLogs)
      .innerJoin(products, sql`${products.id} = ${inventoryLogs.productId}`)
      .orderBy(sql`${inventoryLogs.createdAt} desc`)
      .limit(10);

    const totalInventoryValue = inventoryValueRow?.value ?? 0;
    const pct = (current: number, previous: number) => {
      if (previous === 0) {
        return current === 0 ? 0 : 100;
      }
      return ((current - previous) / Math.abs(previous)) * 100;
    };

    const inventoryDeltaPercent = pct(inventoryDeltaLast7d?.value ?? 0, inventoryDeltaPrev7d?.value ?? 0);
    const pendingOrdersDeltaPercent = pct(ordersLast7d?.count ?? 0, ordersPrev7d?.count ?? 0);
    const wipDeltaPercent = pct(wipLast7d?.count ?? 0, wipPrev7d?.count ?? 0);
    const lowStockDeltaPercent = lowStockCount?.count ? -Math.min(100, (lowStockCount.count / 20) * 100) : 0;

    return {
      totalInventoryValue,
      formattedInventoryValue: formatInr(totalInventoryValue),
      pendingOrders: pendingOrders?.count ?? 0,
      wipCount: wipCount?.count ?? 0,
      lowStockCount: lowStockCount?.count ?? 0,
      inventoryDeltaPercent,
      pendingOrdersDeltaPercent,
      wipDeltaPercent,
      lowStockDeltaPercent,
      recentActivities
    };
  }
};
