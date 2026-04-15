import { and, asc, desc, eq, ilike, or, sql } from "drizzle-orm";
import { AppError } from "../../common/errors/AppError";
import { db } from "../../db";
import { customers, erpOrderEvents, erpOrders, orderEvents, suppliers } from "../../db/schema";
import {
  validateCreateEntityPayload,
  validateListEntitiesQuery,
  validateUpdateEntityPayload,
  ENTITY_TYPES
} from "./entities.validation";

type LegacyEntityType = (typeof ENTITY_TYPES)[keyof typeof ENTITY_TYPES];

type EntityView = {
  id: string;
  entityCode: string;
  type: LegacyEntityType;
  name: string;
  contact: string;
  location: string;
  value: number;
  status: string;
  mode: string;
  updatedAt: string;
  createdAt: string;
  isDeleted?: boolean;
  deletedAt?: string | null;
};

type EntityRow = {
  id: string;
  entityCode: string;
  type: LegacyEntityType;
  name: string;
  contact: string;
  location: string;
  value: number;
  status: string;
  mode: string;
  createdAt: Date;
  updatedAt: Date;
  isDeleted: boolean;
  deletedAt: string | null;
  source: "customer" | "supplier";
};

type CustomerRow = {
  id: string;
  customerCode: string;
  name: string;
  email: string | null;
  phone: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
};

type SupplierRow = {
  id: string;
  supplierCode: string;
  name: string;
  email: string | null;
  phone: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
};

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const isUuid = (value: string) => UUID_REGEX.test(value);

const DEFAULT_MODE = "Active";

const nowIso = () => new Date().toISOString();

const nextEntityCode = (prefix: string) => {
  const token = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `${prefix}-${new Date().toISOString().slice(0, 10).replaceAll("-", "")}-${token}`;
};

const toNumber = (value: unknown, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const toMetadata = (metadata: Record<string, unknown> | null) => metadata ?? {};

const normalizeCustomer = (row: CustomerRow): EntityRow => {
  const metadata = toMetadata(row.metadata);

  return {
    id: row.id,
    entityCode: row.customerCode,
    type: ENTITY_TYPES.CUSTOMER,
    name: row.name,
    contact: (typeof metadata.contact === "string" && metadata.contact) || row.email || row.phone || "-",
    location: (typeof metadata.location === "string" && metadata.location) || "Unknown",
    value: toNumber(metadata.value, 0),
    status: (typeof metadata.status === "string" && metadata.status) || "Approved",
    mode: (typeof metadata.mode === "string" && metadata.mode) || DEFAULT_MODE,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    isDeleted: metadata.isDeleted === true,
    deletedAt: typeof metadata.deletedAt === "string" ? metadata.deletedAt : null,
    source: "customer"
  };
};

const normalizeSupplier = (row: SupplierRow): EntityRow => {
  const metadata = toMetadata(row.metadata);

  return {
    id: row.id,
    entityCode: row.supplierCode,
    type: ENTITY_TYPES.SUPPLIER,
    name: row.name,
    contact: (typeof metadata.contact === "string" && metadata.contact) || row.email || row.phone || "-",
    location: (typeof metadata.location === "string" && metadata.location) || "Unknown",
    value: toNumber(metadata.value, 0),
    status: (typeof metadata.status === "string" && metadata.status) || "Approved",
    mode: (typeof metadata.mode === "string" && metadata.mode) || DEFAULT_MODE,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    isDeleted: metadata.isDeleted === true,
    deletedAt: typeof metadata.deletedAt === "string" ? metadata.deletedAt : null,
    source: "supplier"
  };
};

const toPublicEntity = (entity: EntityRow): EntityView => ({
  id: entity.id,
  entityCode: entity.entityCode,
  type: entity.type,
  name: entity.name,
  contact: entity.contact,
  location: entity.location,
  value: entity.value,
  status: entity.status,
  mode: entity.mode,
  updatedAt: entity.updatedAt.toISOString(),
  createdAt: entity.createdAt.toISOString(),
  isDeleted: entity.isDeleted,
  deletedAt: entity.deletedAt
});

const compareValues = (left: unknown, right: unknown, direction: number) => {
  if (typeof left === "number" && typeof right === "number") {
    return direction * (left - right);
  }

  return direction * String(left).localeCompare(String(right));
};

const getAllEntities = async () => {
  const [customerRows, supplierRows] = await Promise.all([
    db.select().from(customers),
    db.select().from(suppliers)
  ]);

  return [
    ...customerRows.map((row) => normalizeCustomer(row as CustomerRow)),
    ...supplierRows.map((row) => normalizeSupplier(row as SupplierRow))
  ];
};

const findEntityById = async (id: string) => {
  const entities = await getAllEntities();
  const entity = entities.find((item) => item.id === id && item.isDeleted !== true);
  if (!entity) {
    throw new AppError("Entity not found", 404, "NOT_FOUND", { id });
  }
  return entity;
};

const findCustomer = async (code: string) => {
  const [row] = await db.select().from(customers).where(ilike(customers.customerCode, code)).limit(1);
  return row as CustomerRow | undefined;
};

const findSupplier = async (code: string) => {
  const [row] = await db.select().from(suppliers).where(ilike(suppliers.supplierCode, code)).limit(1);
  return row as SupplierRow | undefined;
};

const findCustomerById = async (id: string) => {
  if (!isUuid(id)) {
    return undefined;
  }
  const [row] = await db.select().from(customers).where(eq(customers.id, id)).limit(1);
  return row as CustomerRow | undefined;
};

const findSupplierById = async (id: string) => {
  if (!isUuid(id)) {
    return undefined;
  }
  const [row] = await db.select().from(suppliers).where(eq(suppliers.id, id)).limit(1);
  return row as SupplierRow | undefined;
};

const withMetadataPatch = (
  current: Record<string, unknown> | null,
  patch: Record<string, unknown>
) => ({
  ...(current ?? {}),
  ...patch
});

export const entitiesService = {
  async createEntity(payload: unknown) {
    const validated = validateCreateEntityPayload(payload);
    const metadata = {
      contact: validated.contact,
      location: validated.location,
      value: validated.value,
      status: validated.status,
      mode: validated.mode,
      isDeleted: false,
      deletedAt: null
    } as Record<string, unknown>;

    if (validated.type === ENTITY_TYPES.CUSTOMER) {
      const [created] = await db
        .insert(customers)
        .values({
          customerCode: nextEntityCode("CUST"),
          name: validated.name,
          email: validated.contact.includes("@") ? validated.contact : null,
          phone: validated.contact.includes("@") ? null : validated.contact,
          metadata
        })
        .returning();

      return toPublicEntity(normalizeCustomer(created as CustomerRow));
    }

    const [created] = await db
      .insert(suppliers)
      .values({
        supplierCode: nextEntityCode("SUPP"),
        name: validated.name,
        email: validated.contact.includes("@") ? validated.contact : null,
        phone: validated.contact.includes("@") ? null : validated.contact,
        metadata
      })
      .returning();

    return toPublicEntity(normalizeSupplier(created as SupplierRow));
  },

  async getEntities(query: Record<string, unknown> = {}) {
    const { page, limit, search, types, sort, order } = validateListEntitiesQuery(query);
    let items = (await getAllEntities()).filter((entity) => entity.isDeleted !== true);

    if (types.length > 0) {
      items = items.filter((entity) => types.includes(entity.type));
    }

    if (search) {
      items = items.filter((entity) => {
        const searchable = [
          entity.id,
          entity.entityCode,
          entity.type,
          entity.name,
          entity.contact,
          entity.location,
          entity.status,
          entity.mode
        ]
          .join(" ")
          .toLowerCase();

        return searchable.includes(search);
      });
    }

    const direction = order === "asc" ? 1 : -1;
    items.sort((left, right) => compareValues(left[sort], right[sort], direction));

    const total = items.length;
    const totalPages = total === 0 ? 0 : Math.ceil(total / limit);
    const offset = (page - 1) * limit;
    const pagedItems = items.slice(offset, offset + limit).map(toPublicEntity);

    return {
      items: pagedItems,
      pagination: {
        page,
        limit,
        total,
        totalPages
      }
    };
  },

  async getEntityById(id: string) {
    return toPublicEntity(await findEntityById(id));
  },

  async updateEntity(id: string, payload: unknown) {
    const validated = validateUpdateEntityPayload(payload);
    const entity = await findEntityById(id);
    const metadata = withMetadataPatch(
      entity.source === "customer"
        ? (await findCustomer(entity.entityCode))?.metadata ?? {}
        : (await findSupplier(entity.entityCode))?.metadata ?? {},
      {
        contact: Object.prototype.hasOwnProperty.call(validated, "contact") ? validated.contact : entity.contact,
        location: Object.prototype.hasOwnProperty.call(validated, "location") ? validated.location : entity.location,
        value: Object.prototype.hasOwnProperty.call(validated, "value") ? validated.value : entity.value,
        status: Object.prototype.hasOwnProperty.call(validated, "status") ? validated.status : entity.status,
        mode: Object.prototype.hasOwnProperty.call(validated, "mode") ? validated.mode : entity.mode,
        isDeleted: false,
        deletedAt: null
      }
    );

    if (entity.source === "customer") {
      const [updated] = await db
        .update(customers)
        .set({
          name: Object.prototype.hasOwnProperty.call(validated, "name") ? validated.name!.trim() : entity.name,
          metadata,
          updatedAt: new Date()
        })
        .where(eq(customers.id, id))
        .returning();

      return toPublicEntity(normalizeCustomer(updated as CustomerRow));
    }

    const [updated] = await db
      .update(suppliers)
      .set({
        name: Object.prototype.hasOwnProperty.call(validated, "name") ? validated.name!.trim() : entity.name,
        metadata,
        updatedAt: new Date()
      })
      .where(eq(suppliers.id, id))
      .returning();

    return toPublicEntity(normalizeSupplier(updated as SupplierRow));
  },

  async deleteEntity(id: string) {
    const entity = await findEntityById(id);
    const metadataPatch = withMetadataPatch(
      entity.source === "customer"
        ? (await findCustomer(entity.entityCode))?.metadata ?? {}
        : (await findSupplier(entity.entityCode))?.metadata ?? {},
      {
        isDeleted: true,
        deletedAt: nowIso()
      }
    );

    if (entity.source === "customer") {
      await db
        .update(customers)
        .set({ metadata: metadataPatch, updatedAt: new Date() })
        .where(eq(customers.id, id));
    } else {
      await db
        .update(suppliers)
        .set({ metadata: metadataPatch, updatedAt: new Date() })
        .where(eq(suppliers.id, id));
    }

    return {
      id,
      deleted: true
    };
  },

  async lookupEntity(entityCode: string) {
    const lookupCode = String(entityCode || "").trim();
    const customer = await findCustomer(lookupCode);
    if (customer) {
      return {
        entityCode: customer.customerCode,
        entityName: customer.name,
        entityType: ENTITY_TYPES.CUSTOMER,
        id: customer.id
      };
    }

    const supplier = await findSupplier(lookupCode);
    if (supplier) {
      return {
        entityCode: supplier.supplierCode,
        entityName: supplier.name,
        entityType: ENTITY_TYPES.SUPPLIER,
        id: supplier.id
      };
    }

    const customerById = await findCustomerById(lookupCode);
    if (customerById) {
      return {
        entityCode: customerById.customerCode,
        entityName: customerById.name,
        entityType: ENTITY_TYPES.CUSTOMER,
        id: customerById.id
      };
    }

    const supplierById = await findSupplierById(lookupCode);
    if (supplierById) {
      return {
        entityCode: supplierById.supplierCode,
        entityName: supplierById.name,
        entityType: ENTITY_TYPES.SUPPLIER,
        id: supplierById.id
      };
    }

    throw new AppError("Entity code not found", 404, "NOT_FOUND", { entityCode: lookupCode });
  },

  async getCustomerByCode(customerId: string) {
    const customer = await findCustomer(String(customerId || "").trim());
    if (!customer) {
      throw new AppError("Customer not found", 404, "NOT_FOUND", { customerId });
    }
    return toPublicEntity(normalizeCustomer(customer));
  },

  async getSupplierByCode(supplierId: string) {
    const supplier = await findSupplier(String(supplierId || "").trim());
    if (!supplier) {
      throw new AppError("Supplier not found", 404, "NOT_FOUND", { supplierId });
    }
    return toPublicEntity(normalizeSupplier(supplier));
  },

  async createOrderFromEntity(id: string) {
    const entity = await findEntityById(id);
    const orderType = entity.type === ENTITY_TYPES.CUSTOMER ? "SALE" : "PURCHASE";
    const orderReference = `${orderType}-${nowIso().slice(0, 10).replaceAll("-", "")}-${Math.random()
      .toString(36)
      .slice(2, 8)
      .toUpperCase()}`;

    const [created] = await db
      .insert(erpOrders)
      .values({
        orderNumber: orderReference,
        type: orderType,
        customerId: entity.type === ENTITY_TYPES.CUSTOMER ? entity.id : null,
        supplierId: entity.type === ENTITY_TYPES.SUPPLIER ? entity.id : null,
        status: "DRAFT",
        paymentStatus: "UNPAID",
        isDraft: true,
        notes: `Created from entity ${entity.entityCode}`,
        owner: entity.entityCode,
        metadata: {
          source: "entities-module",
          entityId: entity.id,
          entityCode: entity.entityCode,
          entityType: entity.type
        }
      })
      .returning();

    await db.insert(orderEvents).values({
      orderId: created.id,
      action: "ENTITY_ORDER_CREATED",
      actor: "system",
      remarks: `Created from ${entity.entityCode}`,
      metadata: {
        entityId: entity.id,
        entityCode: entity.entityCode,
        entityType: entity.type
      }
    });

    await db.insert(erpOrderEvents).values({
      orderId: created.id,
      action: "ENTITY_ORDER_CREATED",
      actor: "system",
      remarks: `Created from ${entity.entityCode}`,
      metadata: {
        entityId: entity.id,
        entityCode: entity.entityCode,
        entityType: entity.type
      }
    });

    return {
      draftId: created.id,
      orderReference: created.orderNumber,
      type: created.type,
      entity: {
        id: entity.id,
        entityCode: entity.entityCode,
        name: entity.name,
        type: entity.type
      },
      status: created.status,
      createdAt: created.createdAt.toISOString()
    };
  }
};
