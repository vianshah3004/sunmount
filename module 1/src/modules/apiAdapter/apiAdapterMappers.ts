import { OrderStatus } from "../orders/orders.service";

type ProductRow = {
  id: string;
  productCode: string;
  name: string;
  description: string | null;
  weight: string | null;
  price: string;
  quantity: number;
  updatedAt: Date;
};

type OrderProduct = {
  productCode: string;
  quantity: number;
  price: number;
};

type OrderLike = {
  orderId?: string;
  id?: string;
  type: "SALE" | "PURCHASE";
  partyId: string;
  status: OrderStatus | string;
  products?: OrderProduct[];
  items?: OrderProduct[];
  notes: string | null;
  updatedAt: Date;
  orderDate: Date;
};

type BatchLike = {
  batchNumber?: string;
  id?: string;
  status: "IN_PROGRESS" | "COMPLETED" | "CANCELLED" | string;
  materialConsumed?: boolean;
  outputAdded?: boolean;
  rawMaterials: Array<{ productCode: string; quantity: number }>;
  outputProducts: Array<{ productCode: string; quantity: number }>;
  notes: string | null;
  startDate: Date;
  endDate: Date | null;
  updatedAt: Date;
};

const toIso = (value: Date | string) => new Date(value).toISOString();

export const toInventoryStatus = (quantity: number) => {
  if (quantity > 50) return "In Stock";
  if (quantity > 20) return "Auto-Refill";
  if (quantity > 5) return "Low Stock";
  return "Critical";
};

const orderStageMap: Record<OrderStatus, "Quotation" | "Packing" | "Dispatch" | "History"> = {
  CREATED: "Quotation",
  APPROVED: "Quotation",
  ORDERED: "Packing",
  RECEIVED: "Dispatch",
  QUOTATION: "Quotation",
  CONFIRMED: "Quotation",
  PACKED: "Packing",
  QUOTATION_RECEIVED: "Quotation",
  PACKING: "Packing",
  DISPATCHED: "Dispatch",
  DELIVERED: "History",
  PAID: "History",
  UNPAID: "History",
  COMPLETED: "History",
  CANCELLED: "History"
};

const orderStatusMap: Record<OrderStatus, string> = {
  CREATED: "Created",
  APPROVED: "Approved",
  ORDERED: "Ordered",
  RECEIVED: "Received",
  QUOTATION: "Quotation",
  CONFIRMED: "Confirmed",
  PACKED: "Packed",
  QUOTATION_RECEIVED: "Quotation Received",
  PACKING: "Packing",
  DISPATCHED: "Dispatched",
  DELIVERED: "Delivered",
  PAID: "Paid",
  UNPAID: "Unpaid",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled"
};

export const toInventoryItem = (row: ProductRow) => ({
  id: row.id,
  code: row.productCode,
  name: row.name,
  description: row.description,
  weight: row.weight !== null ? Number(row.weight) : null,
  price: Number(row.price),
  quantity: row.quantity,
  status: toInventoryStatus(row.quantity),
  lastUpdated: toIso(row.updatedAt)
});

const calcSubtotal = (products: OrderProduct[]) =>
  products.reduce((sum, item) => sum + item.quantity * item.price, 0);

const normalizeOrder = (order: OrderLike) => ({
  ...order,
  orderId: order.orderId ?? order.id ?? "",
  status: order.status as OrderStatus,
  products: order.products ?? order.items ?? []
});

const normalizeBatch = (batch: BatchLike) => ({
  ...batch,
  batchNumber: batch.batchNumber ?? batch.id ?? "",
  status: (batch.status as "IN_PROGRESS" | "COMPLETED" | "CANCELLED") ?? "IN_PROGRESS"
});

export const toSalesQueueItem = (input: OrderLike) => {
  const order = normalizeOrder(input);
  return {
    id: order.orderId,
    customer: order.partyId,
    customerId: order.partyId,
    stage: orderStageMap[order.status],
    status: orderStatusMap[order.status],
    amount: calcSubtotal(order.products),
    updated: toIso(order.updatedAt)
  };
};

export const toPurchaseQueueItem = (input: OrderLike) => {
  const order = normalizeOrder(input);
  return {
    id: order.orderId,
    supplier: order.partyId,
    supplierId: order.partyId,
    stage: orderStageMap[order.status],
    status: orderStatusMap[order.status],
    amount: calcSubtotal(order.products),
    updated: toIso(order.updatedAt)
  };
};

export const toSalesLines = (input: OrderLike) => {
  const order = normalizeOrder(input);
  return {
    id: order.orderId,
    lines: order.products.map((line) => ({
      code: line.productCode,
      quantity: line.quantity,
      unitPrice: line.price,
      lineTotal: line.quantity * line.price
    })),
    amount: calcSubtotal(order.products),
    note: order.notes,
    updated: toIso(order.updatedAt)
  };
};

export const toPurchaseLines = toSalesLines;

export const toManufacturingBatch = (input: BatchLike) => {
  const batch = normalizeBatch(input);
  return {
    id: batch.batchNumber,
    title: batch.notes ?? batch.batchNumber,
    materials: batch.rawMaterials,
    output: batch.outputProducts,
    progress: batch.status === "COMPLETED" ? 100 : batch.status === "CANCELLED" ? 0 : 60,
    operator: "System",
    eta: batch.endDate ? toIso(batch.endDate) : null,
    status: batch.status,
    statusLabel: batch.status === "IN_PROGRESS" ? "In Progress" : batch.status === "COMPLETED" ? "Completed" : "Cancelled",
    materialConsumed: Boolean(batch.materialConsumed),
    outputAdded: Boolean(batch.outputAdded),
    updated: toIso(batch.updatedAt)
  };
};

export const toHistoryRowFromOrder = (input: OrderLike) => {
  const order = normalizeOrder(input);
  return {
    id: `${order.type === "SALE" ? "sale" : "purchase"}:${order.orderId}`,
    type: order.type === "SALE" ? "Sales" : "Purchase",
    party: order.partyId,
    value: calcSubtotal(order.products),
    status: orderStatusMap[order.status],
    date: toIso(order.orderDate),
    note: order.notes
  };
};

export const toHistoryRowFromBatch = (input: BatchLike) => {
  const batch = normalizeBatch(input);
  return {
    id: `manufacturing:${batch.batchNumber}`,
    type: "Manufacturing",
    party: batch.batchNumber,
    value: batch.outputProducts.reduce((sum, line) => sum + line.quantity, 0),
    status: batch.status === "COMPLETED" ? "Approved" : "Pending",
    date: toIso(batch.startDate),
    note: batch.notes
  };
};

export const toDashboardMetrics = (summary: {
  totalInventoryValue: number;
  pendingOrders: number;
  wipCount: number;
  lowStockCount: number;
  inventoryDeltaPercent?: number;
  pendingOrdersDeltaPercent?: number;
  wipDeltaPercent?: number;
  lowStockDeltaPercent?: number;
}) => [
  {
    label: "Inventory Value",
    value: summary.totalInventoryValue,
    delta: `${Math.round(summary.inventoryDeltaPercent ?? 0)}%`,
    icon: "warehouse",
    tone: "primary" as const
  },
  {
    label: "Pending Orders",
    value: summary.pendingOrders,
    delta: `${Math.round(summary.pendingOrdersDeltaPercent ?? 0)}%`,
    icon: "orders",
    tone: "secondary" as const
  },
  {
    label: "WIP Batches",
    value: summary.wipCount,
    delta: `${Math.round(summary.wipDeltaPercent ?? 0)}%`,
    icon: "factory",
    tone: "tertiary" as const
  },
  {
    label: "Low Stock Items",
    value: summary.lowStockCount,
    delta: `${Math.round(summary.lowStockDeltaPercent ?? 0)}%`,
    icon: "warning",
    tone: "teal" as const
  }
];

export const normalizeEntityType = (type: "SALE" | "PURCHASE") =>
  type === "SALE" ? "Customer" : "Supplier";
