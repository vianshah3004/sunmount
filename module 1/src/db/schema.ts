import { relations, sql } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar
} from "drizzle-orm/pg-core";

export const inventoryChangeTypeEnum = pgEnum("inventory_change_type", [
  "SALE",
  "PURCHASE",
  "WIP_RAW",
  "WIP_OUTPUT"
]);

export const orderTypeEnum = pgEnum("order_type", ["SALE", "PURCHASE"]);

export const erpOrderStatusEnum = pgEnum("erp_order_status", [
  "DRAFT",
  "QUOTATION",
  "APPROVED",
  "PACKING",
  "DISPATCHED",
  "COMPLETED",
  "ON_HOLD",
  "CANCELLED"
]);

export const erpPaymentStatusEnum = pgEnum("erp_payment_status", [
  "UNPAID",
  "PARTIALLY_PAID",
  "PAID",
  "REFUNDED"
]);

export const userRoleEnum = pgEnum("user_role", ["ADMIN", "OPERATOR", "ACCOUNTANT"]);

export const orderStatusEnum = pgEnum("order_status", [
  "QUOTATION",
  "QUOTATION_RECEIVED",
  "PACKING",
  "DISPATCHED",
  "PAID",
  "UNPAID",
  "COMPLETED",
  "CANCELLED"
]);

export const manufacturingStatusEnum = pgEnum("manufacturing_status", [
  "IN_PROGRESS",
  "COMPLETED",
  "CANCELLED"
]);

export type OrderLineItem = {
  productCode: string;
  quantity: number;
  price: number;
};

export type ManufacturingLineItem = {
  productCode: string;
  quantity: number;
};

export const products = pgTable(
  "products",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    productCode: varchar("product_code", { length: 64 }).notNull(),
    name: varchar("name", { length: 255 }).notNull(),
    unit: varchar("unit", { length: 16 }).notNull().default("pcs"),
    description: text("description"),
    weight: numeric("weight", { precision: 12, scale: 3 }),
    price: numeric("price", { precision: 12, scale: 2 }).notNull(),
    quantity: integer("quantity").notNull().default(0),
    lowStockThreshold: integer("low_stock_threshold").notNull().default(10),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
  },
  (table) => ({
    productCodeUnique: uniqueIndex("products_product_code_uniq").on(table.productCode),
    quantityIdx: index("products_quantity_idx").on(table.quantity)
  })
);

export const orders = pgTable(
  "orders",
  {
    orderId: uuid("order_id").defaultRandom().primaryKey(),
    type: orderTypeEnum("type").notNull(),
    partyId: varchar("party_id", { length: 128 }).notNull(),
    products: jsonb("products")
      .$type<OrderLineItem[]>()
      .notNull()
      .default(sql`'[]'::jsonb`),
    status: orderStatusEnum("status").notNull(),
    orderDate: timestamp("order_date", { withTimezone: true }).notNull().defaultNow(),
    notes: text("notes"),
    inventoryApplied: boolean("inventory_applied").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
  },
  (table) => ({
    typeIdx: index("orders_type_idx").on(table.type),
    statusIdx: index("orders_status_idx").on(table.status),
    orderDateIdx: index("orders_order_date_idx").on(table.orderDate),
    partyIdx: index("orders_party_idx").on(table.partyId)
  })
);

export const manufacturingBatches = pgTable(
  "manufacturing_batches",
  {
    batchNumber: varchar("batch_number", { length: 64 }).primaryKey(),
    rawMaterials: jsonb("raw_materials")
      .$type<ManufacturingLineItem[]>()
      .notNull()
      .default(sql`'[]'::jsonb`),
    outputProducts: jsonb("output_products")
      .$type<ManufacturingLineItem[]>()
      .notNull()
      .default(sql`'[]'::jsonb`),
    status: manufacturingStatusEnum("status").notNull().default("IN_PROGRESS"),
    startDate: timestamp("start_date", { withTimezone: true }).notNull().defaultNow(),
    endDate: timestamp("end_date", { withTimezone: true }),
    materialConsumed: boolean("material_consumed").notNull().default(false),
    outputAdded: boolean("output_added").notNull().default(false),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
  },
  (table) => ({
    statusIdx: index("manufacturing_status_idx").on(table.status),
    startDateIdx: index("manufacturing_start_date_idx").on(table.startDate),
    endDateIdx: index("manufacturing_end_date_idx").on(table.endDate)
  })
);

export const inventoryLogs = pgTable(
  "inventory_logs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    changeType: inventoryChangeTypeEnum("change_type").notNull(),
    quantity: integer("quantity").notNull(),
    referenceId: varchar("reference_id", { length: 128 }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
  },
  (table) => ({
    productIdIdx: index("inventory_logs_product_id_idx").on(table.productId),
    createdAtIdx: index("inventory_logs_created_at_idx").on(table.createdAt)
  })
);

export const orderItems = pgTable(
  "order_items",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    orderId: uuid("order_id")
      .notNull()
      .references(() => orders.orderId, { onDelete: "cascade" }),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "restrict" }),
    sku: varchar("sku", { length: 64 }).notNull(),
    quantity: integer("quantity").notNull(),
    unitPrice: numeric("unit_price", { precision: 12, scale: 2 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
  },
  (table) => ({
    orderIdIdx: index("order_items_order_id_idx").on(table.orderId),
    productIdIdx: index("order_items_product_id_idx").on(table.productId),
    skuIdx: index("order_items_sku_idx").on(table.sku)
  })
);

export const manufacturingItems = pgTable(
  "manufacturing_items",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    batchNumber: varchar("batch_number", { length: 64 })
      .notNull()
      .references(() => manufacturingBatches.batchNumber, { onDelete: "cascade" }),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "restrict" }),
    itemType: varchar("item_type", { length: 16 }).notNull(),
    quantity: integer("quantity").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
  },
  (table) => ({
    batchIdx: index("manufacturing_items_batch_number_idx").on(table.batchNumber),
    productIdIdx: index("manufacturing_items_product_id_idx").on(table.productId),
    typeIdx: index("manufacturing_items_type_idx").on(table.itemType)
  })
);

export const history = pgTable(
  "history",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    entityType: varchar("entity_type", { length: 32 }).notNull(),
    entityId: varchar("entity_id", { length: 128 }).notNull(),
    action: varchar("action", { length: 32 }).notNull(),
    summary: text("summary").notNull(),
    payload: jsonb("payload").$type<Record<string, unknown>>().notNull().default(sql`'{}'::jsonb`),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
  },
  (table) => ({
    entityTypeIdx: index("history_entity_type_idx").on(table.entityType),
    entityIdIdx: index("history_entity_id_idx").on(table.entityId),
    createdAtIdx: index("history_created_at_idx").on(table.createdAt)
  })
);

export const customers = pgTable(
  "customers",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    customerCode: varchar("customer_code", { length: 64 }).notNull(),
    name: varchar("name", { length: 255 }).notNull(),
    email: varchar("email", { length: 255 }),
    phone: varchar("phone", { length: 32 }),
    taxId: varchar("tax_id", { length: 64 }),
    metadata: jsonb("metadata").$type<Record<string, unknown>>().notNull().default(sql`'{}'::jsonb`),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
  },
  (table) => ({
    customerCodeUnique: uniqueIndex("customers_customer_code_uniq").on(table.customerCode),
    nameIdx: index("customers_name_idx").on(table.name)
  })
);

export const suppliers = pgTable(
  "suppliers",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    supplierCode: varchar("supplier_code", { length: 64 }).notNull(),
    name: varchar("name", { length: 255 }).notNull(),
    email: varchar("email", { length: 255 }),
    phone: varchar("phone", { length: 32 }),
    taxId: varchar("tax_id", { length: 64 }),
    metadata: jsonb("metadata").$type<Record<string, unknown>>().notNull().default(sql`'{}'::jsonb`),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
  },
  (table) => ({
    supplierCodeUnique: uniqueIndex("suppliers_supplier_code_uniq").on(table.supplierCode),
    nameIdx: index("suppliers_name_idx").on(table.name)
  })
);

export const settings = pgTable("settings", {
  id: integer("id").primaryKey(),
  organization: varchar("organization", { length: 255 }).notNull(),
  primaryContactEmail: varchar("primary_contact_email", { length: 255 }).notNull(),
  currency: varchar("currency", { length: 8 }).notNull().default("INR"),
  timezone: varchar("timezone", { length: 64 }).notNull().default("Asia/Kolkata"),
  notificationsEnabled: boolean("notifications_enabled").notNull().default(true),
  securityFlags: jsonb("security_flags").$type<Record<string, unknown>>().notNull().default(sql`'{}'::jsonb`),
  sync: jsonb("sync").$type<Record<string, unknown>>().notNull().default(sql`'{}'::jsonb`),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
});

export const users = pgTable(
  "users",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    username: varchar("username", { length: 128 }).notNull(),
    passwordHash: varchar("password_hash", { length: 255 }).notNull(),
    role: userRoleEnum("role").notNull().default("OPERATOR"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
  },
  (table) => ({
    usernameUnique: uniqueIndex("users_username_uniq").on(table.username)
  })
);

export const userSessions = pgTable(
  "user_sessions",
  {
    sessionId: uuid("session_id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    username: varchar("username", { length: 128 }).notNull(),
    role: userRoleEnum("role").notNull(),
    ipAddress: varchar("ip_address", { length: 64 }),
    userAgent: varchar("user_agent", { length: 512 }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    lastSeenAt: timestamp("last_seen_at", { withTimezone: true }).notNull().defaultNow(),
    logoutAt: timestamp("logout_at", { withTimezone: true }),
    sessionDurationMs: integer("session_duration_ms").notNull().default(0),
    active: boolean("active").notNull().default(true),
    metadata: jsonb("metadata").$type<Record<string, unknown>>().notNull().default(sql`'{}'::jsonb`)
  },
  (table) => ({
    userIdx: index("user_sessions_user_id_idx").on(table.userId),
    activeIdx: index("user_sessions_active_idx").on(table.active),
    createdAtIdx: index("user_sessions_created_at_idx").on(table.createdAt)
  })
);

export const activityLogs = pgTable(
  "activity_logs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    sessionId: uuid("session_id")
      .notNull()
      .references(() => userSessions.sessionId, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    username: varchar("username", { length: 128 }).notNull(),
    action: varchar("action", { length: 64 }).notNull(),
    route: varchar("route", { length: 255 }).notNull(),
    method: varchar("method", { length: 16 }).notNull(),
    statusCode: integer("status_code").notNull(),
    durationMs: integer("duration_ms").notNull(),
    ipAddress: varchar("ip_address", { length: 64 }),
    userAgent: varchar("user_agent", { length: 512 }),
    details: jsonb("details").$type<Record<string, unknown>>().notNull().default(sql`'{}'::jsonb`),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
  },
  (table) => ({
    sessionIdx: index("activity_logs_session_id_idx").on(table.sessionId),
    userIdx: index("activity_logs_user_id_idx").on(table.userId),
    routeIdx: index("activity_logs_route_idx").on(table.route),
    createdAtIdx: index("activity_logs_created_at_idx").on(table.createdAt)
  })
);

export const transitionLogs = pgTable(
  "transition_logs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    entityType: varchar("entity_type", { length: 32 }).notNull(),
    entityId: varchar("entity_id", { length: 128 }).notNull(),
    previousState: varchar("previous_state", { length: 64 }).notNull(),
    newState: varchar("new_state", { length: 64 }).notNull(),
    performedBy: varchar("performed_by", { length: 128 }).notNull().default("system"),
    action: varchar("action", { length: 64 }).notNull(),
    idempotencyKey: varchar("idempotency_key", { length: 128 }),
    metadata: jsonb("metadata").$type<Record<string, unknown>>().notNull().default(sql`'{}'::jsonb`),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
  },
  (table) => ({
    entityIdx: index("transition_logs_entity_idx").on(table.entityType, table.entityId),
    createdAtIdx: index("transition_logs_created_at_idx").on(table.createdAt),
    stateIdx: index("transition_logs_state_idx").on(table.newState),
    idempotencyUnique: uniqueIndex("transition_logs_idempotency_uniq").on(
      table.entityType,
      table.entityId,
      table.action,
      table.idempotencyKey
    )
  })
);

export const addresses = pgTable(
  "addresses",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    label: varchar("label", { length: 64 }),
    line1: varchar("line1", { length: 255 }).notNull(),
    line2: varchar("line2", { length: 255 }),
    city: varchar("city", { length: 128 }).notNull(),
    state: varchar("state", { length: 128 }),
    country: varchar("country", { length: 128 }).notNull().default("India"),
    postalCode: varchar("postal_code", { length: 32 }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
  },
  (table) => ({
    cityIdx: index("addresses_city_idx").on(table.city),
    postalIdx: index("addresses_postal_idx").on(table.postalCode)
  })
);

export const erpOrders = pgTable(
  "erp_orders",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    orderNumber: varchar("order_number", { length: 64 }).notNull(),
    type: orderTypeEnum("type").notNull(),
    customerId: uuid("customer_id").references(() => customers.id, { onDelete: "set null" }),
    supplierId: uuid("supplier_id").references(() => suppliers.id, { onDelete: "set null" }),
    addressId: uuid("address_id").references(() => addresses.id, { onDelete: "set null" }),
    status: erpOrderStatusEnum("status").notNull().default("DRAFT"),
    paymentStatus: erpPaymentStatusEnum("payment_status").notNull().default("UNPAID"),
    subtotalAmount: numeric("subtotal_amount", { precision: 14, scale: 2 }).notNull().default("0"),
    discountAmount: numeric("discount_amount", { precision: 14, scale: 2 }).notNull().default("0"),
    freightCharges: numeric("freight_charges", { precision: 14, scale: 2 }).notNull().default("0"),
    packingCharges: numeric("packing_charges", { precision: 14, scale: 2 }).notNull().default("0"),
    taxAmount: numeric("tax_amount", { precision: 14, scale: 2 }).notNull().default("0"),
    grandTotal: numeric("grand_total", { precision: 14, scale: 2 }).notNull().default("0"),
    currency: varchar("currency", { length: 8 }).notNull().default("INR"),
    deliveryDate: timestamp("delivery_date", { withTimezone: true }),
    paymentTerms: varchar("payment_terms", { length: 128 }),
    owner: varchar("owner", { length: 128 }),
    notes: text("notes"),
    version: integer("version").notNull().default(1),
    isDraft: boolean("is_draft").notNull().default(true),
    idempotencyKey: varchar("idempotency_key", { length: 128 }),
    metadata: jsonb("metadata").$type<Record<string, unknown>>().notNull().default(sql`'{}'::jsonb`),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
  },
  (table) => ({
    orderNumberUnique: uniqueIndex("erp_orders_order_number_uniq").on(table.orderNumber),
    idemKeyUnique: uniqueIndex("erp_orders_idempotency_key_uniq").on(table.idempotencyKey),
    typeIdx: index("erp_orders_type_idx").on(table.type),
    statusIdx: index("erp_orders_status_idx").on(table.status),
    paymentStatusIdx: index("erp_orders_payment_status_idx").on(table.paymentStatus),
    createdAtIdx: index("erp_orders_created_at_idx").on(table.createdAt)
  })
);

export const erpOrderItems = pgTable(
  "erp_order_items",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    orderId: uuid("order_id")
      .notNull()
      .references(() => erpOrders.id, { onDelete: "cascade" }),
    lineNumber: integer("line_number").notNull(),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "restrict" }),
    sku: varchar("sku", { length: 64 }).notNull(),
    name: varchar("name", { length: 255 }).notNull(),
    quantity: integer("quantity").notNull(),
    unitPrice: numeric("unit_price", { precision: 14, scale: 2 }).notNull(),
    discountAmount: numeric("discount_amount", { precision: 14, scale: 2 }).notNull().default("0"),
    taxRate: numeric("tax_rate", { precision: 6, scale: 3 }).notNull().default("0"),
    taxAmount: numeric("tax_amount", { precision: 14, scale: 2 }).notNull().default("0"),
    lineTotal: numeric("line_total", { precision: 14, scale: 2 }).notNull(),
    dispatchedQty: integer("dispatched_qty").notNull().default(0),
    receivedQty: integer("received_qty").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
  },
  (table) => ({
    orderIdx: index("erp_order_items_order_id_idx").on(table.orderId),
    productIdx: index("erp_order_items_product_id_idx").on(table.productId),
    lineOrderUnique: uniqueIndex("erp_order_items_order_line_uniq").on(table.orderId, table.lineNumber)
  })
);

export const erpOrderEvents = pgTable(
  "erp_order_events",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    orderId: uuid("order_id")
      .notNull()
      .references(() => erpOrders.id, { onDelete: "cascade" }),
    action: varchar("action", { length: 64 }).notNull(),
    actor: varchar("actor", { length: 128 }).notNull().default("system"),
    remarks: text("remarks"),
    metadata: jsonb("metadata").$type<Record<string, unknown>>().notNull().default(sql`'{}'::jsonb`),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
  },
  (table) => ({
    orderIdx: index("erp_order_events_order_id_idx").on(table.orderId),
    actionIdx: index("erp_order_events_action_idx").on(table.action),
    createdAtIdx: index("erp_order_events_created_at_idx").on(table.createdAt)
  })
);

export const orderEvents = pgTable(
  "order_events",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    orderId: uuid("order_id")
      .notNull()
      .references(() => erpOrders.id, { onDelete: "cascade" }),
    action: varchar("action", { length: 64 }).notNull(),
    actor: varchar("actor", { length: 128 }).notNull().default("system"),
    remarks: text("remarks"),
    metadata: jsonb("metadata").$type<Record<string, unknown>>().notNull().default(sql`'{}'::jsonb`),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
  },
  (table) => ({
    orderIdx: index("order_events_order_id_idx").on(table.orderId),
    actionIdx: index("order_events_action_idx").on(table.action),
    createdAtIdx: index("order_events_created_at_idx").on(table.createdAt)
  })
);

export const attachments = pgTable(
  "attachments",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    orderId: uuid("order_id").references(() => erpOrders.id, { onDelete: "cascade" }),
    fileName: varchar("file_name", { length: 255 }).notNull(),
    fileType: varchar("file_type", { length: 128 }),
    storagePath: varchar("storage_path", { length: 512 }).notNull(),
    uploadedBy: varchar("uploaded_by", { length: 128 }),
    metadata: jsonb("metadata").$type<Record<string, unknown>>().notNull().default(sql`'{}'::jsonb`),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
  },
  (table) => ({
    orderIdx: index("attachments_order_id_idx").on(table.orderId),
    uploadedByIdx: index("attachments_uploaded_by_idx").on(table.uploadedBy)
  })
);

export const productsRelations = relations(products, ({ many }) => ({
  inventoryLogs: many(inventoryLogs)
}));

export const inventoryLogsRelations = relations(inventoryLogs, ({ one }) => ({
  product: one(products, {
    fields: [inventoryLogs.productId],
    references: [products.id]
  })
}));

export type Product = typeof products.$inferSelect;
export type NewProduct = typeof products.$inferInsert;
export type InventoryLog = typeof inventoryLogs.$inferSelect;
export type Order = typeof orders.$inferSelect;
export type NewOrder = typeof orders.$inferInsert;
export type ManufacturingBatch = typeof manufacturingBatches.$inferSelect;
export type NewManufacturingBatch = typeof manufacturingBatches.$inferInsert;
export type ErpOrder = typeof erpOrders.$inferSelect;
export type NewErpOrder = typeof erpOrders.$inferInsert;
export type ErpOrderItem = typeof erpOrderItems.$inferSelect;
export type NewErpOrderItem = typeof erpOrderItems.$inferInsert;
export type SettingsRow = typeof settings.$inferSelect;
export type NewSettingsRow = typeof settings.$inferInsert;
export type OrderEvent = typeof orderEvents.$inferSelect;
export type NewOrderEvent = typeof orderEvents.$inferInsert;
export type TransitionLog = typeof transitionLogs.$inferSelect;
export type NewTransitionLog = typeof transitionLogs.$inferInsert;
