import { formatInr, manufacturingStatusToColor, nextActionsForOrder, orderStatusToColor, orderStatusToLabel } from "./ui";

type ProductEntity = {
  id: string;
  productCode: string;
  name: string;
  quantity: number;
  price: string;
  updatedAt: Date;
  lowStockThreshold: number;
  unit?: string | null;
};

export const toProductView = (product: ProductEntity) => {
  const numericPrice = Number(product.price);
  const lowStockFlag = product.quantity <= product.lowStockThreshold;

  return {
    id: product.id,
    name: product.name,
    sku: product.productCode,
    quantity: product.quantity,
    unit: product.unit ?? "pcs",
    price: numericPrice,
    displayPrice: formatInr(numericPrice),
    lowStockFlag,
    statusTag: lowStockFlag ? "LOW_STOCK" : "IN_STOCK",
    lastUpdated: product.updatedAt
  };
};

type OrderItem = {
  productCode: string;
  quantity: number;
  price: number;
};

type OrderEntity = {
  orderId: string;
  type: "SALE" | "PURCHASE";
  partyId: string;
  products: OrderItem[];
  status: string;
  orderDate: Date;
  notes: string | null;
  inventoryApplied: boolean;
  updatedAt: Date;
};

export const toOrderView = (order: OrderEntity) => {
  const subtotal = order.products.reduce((sum, item) => sum + item.quantity * item.price, 0);

  return {
    id: order.orderId,
    type: order.type,
    partyId: order.partyId,
    items: order.products,
    productCount: order.products.length,
    subtotal,
    currencyFormattedTotal: formatInr(subtotal),
    status: order.status,
    statusLabel: orderStatusToLabel(order.status),
    statusColor: orderStatusToColor(order.status),
    nextActions: nextActionsForOrder(order.status, order.type),
    orderDate: order.orderDate,
    notes: order.notes,
    inventoryApplied: order.inventoryApplied,
    updatedAt: order.updatedAt
  };
};

type ManufacturingItem = {
  productCode: string;
  quantity: number;
};

type ManufacturingEntity = {
  batchNumber: string;
  rawMaterials: ManufacturingItem[];
  outputProducts: ManufacturingItem[];
  status: string;
  startDate: Date;
  endDate: Date | null;
  materialConsumed: boolean;
  outputAdded: boolean;
  notes: string | null;
  updatedAt: Date;
};

const computeProgress = (entity: ManufacturingEntity) => {
  if (entity.status === "COMPLETED") {
    return 100;
  }
  if (entity.status === "CANCELLED") {
    return 0;
  }

  if (entity.materialConsumed && entity.outputAdded) {
    return 90;
  }
  if (entity.materialConsumed) {
    return 55;
  }
  return 20;
};

export const toManufacturingView = (entity: ManufacturingEntity) => ({
  id: entity.batchNumber,
  batchNumber: entity.batchNumber,
  rawMaterials: entity.rawMaterials,
  outputProducts: entity.outputProducts,
  materialConsumed: entity.materialConsumed,
  outputAdded: entity.outputAdded,
  rawMaterialsCount: entity.rawMaterials.length,
  outputCount: entity.outputProducts.length,
  progress: computeProgress(entity),
  status: entity.status,
  statusLabel: orderStatusToLabel(entity.status),
  statusColor: manufacturingStatusToColor(entity.status),
  startDate: entity.startDate,
  endDate: entity.endDate,
  notes: entity.notes,
  updatedAt: entity.updatedAt
});
