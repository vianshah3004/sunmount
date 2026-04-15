import { z } from "zod";

export const ENTITY_TYPES = {
  CUSTOMER: "Customer",
  SUPPLIER: "Supplier"
} as const;

export const ENTITY_MODES = {
  ACTIVE: "Active",
  INACTIVE: "Inactive"
} as const;

const allowedSortFields = ["name", "value", "updatedAt", "type", "status", "mode"] as const;

const createValidationError = (message: string) => {
  const error = new Error(message) as Error & { statusCode: number };
  error.statusCode = 400;
  return error;
};

export const validateListEntitiesQuery = (query: Record<string, unknown>) => {
  const page = query.page === undefined ? 1 : Number(query.page);
  const limit = query.limit === undefined ? 20 : Number(query.limit);

  if (!Number.isInteger(page) || page <= 0) {
    throw createValidationError("page must be a positive integer");
  }

  if (!Number.isInteger(limit) || limit <= 0 || limit > 100) {
    throw createValidationError("limit must be a positive integer between 1 and 100");
  }

  const search = query.search === undefined ? "" : String(query.search).trim().toLowerCase();

  let types: Array<(typeof ENTITY_TYPES)[keyof typeof ENTITY_TYPES]> = [];
  if (query.type) {
    types = String(query.type)
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean)
      .map((value) => value.toLowerCase())
      .map((value) => {
        if (value === "customer") {
          return ENTITY_TYPES.CUSTOMER;
        }
        if (value === "supplier") {
          return ENTITY_TYPES.SUPPLIER;
        }
        throw createValidationError("type must contain customer and/or supplier");
      });
  }

  const sort = query.sort === undefined ? "updatedAt" : String(query.sort).trim();
  if (!allowedSortFields.includes(sort as (typeof allowedSortFields)[number])) {
    throw createValidationError(`sort must be one of: ${allowedSortFields.join(", ")}`);
  }

  const order = query.order === undefined ? "desc" : String(query.order).trim().toLowerCase();
  if (order !== "asc" && order !== "desc") {
    throw createValidationError("order must be asc or desc");
  }

  return {
    page,
    limit,
    search,
    types,
    sort: sort as (typeof allowedSortFields)[number],
    order: order as "asc" | "desc"
  };
};

export const validateUpdateEntityPayload = (payload: unknown) => {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw createValidationError("Request body must be a JSON object");
  }

  const body = payload as Record<string, unknown>;
  const allowedFields = ["name", "contact", "location", "value", "status", "mode"];
  const keys = Object.keys(body);

  if (keys.length === 0) {
    throw createValidationError("At least one entity field must be provided");
  }

  const unknown = keys.filter((key) => !allowedFields.includes(key));
  if (unknown.length > 0) {
    throw createValidationError(`Unknown field(s): ${unknown.join(", ")}`);
  }

  if (Object.prototype.hasOwnProperty.call(body, "name")) {
    if (typeof body.name !== "string" || body.name.trim().length === 0) {
      throw createValidationError("name must be a non-empty string");
    }
  }

  if (Object.prototype.hasOwnProperty.call(body, "contact")) {
    if (typeof body.contact !== "string" || body.contact.trim().length === 0) {
      throw createValidationError("contact must be a non-empty string");
    }
  }

  if (Object.prototype.hasOwnProperty.call(body, "location")) {
    if (typeof body.location !== "string" || body.location.trim().length === 0) {
      throw createValidationError("location must be a non-empty string");
    }
  }

  if (Object.prototype.hasOwnProperty.call(body, "value")) {
    if (typeof body.value !== "number" || !Number.isFinite(body.value) || body.value < 0) {
      throw createValidationError("value must be a number greater than or equal to 0");
    }
  }

  if (Object.prototype.hasOwnProperty.call(body, "status")) {
    if (typeof body.status !== "string" || body.status.trim().length === 0) {
      throw createValidationError("status must be a non-empty string");
    }
  }

  if (Object.prototype.hasOwnProperty.call(body, "mode")) {
    if (typeof body.mode !== "string" || !Object.values(ENTITY_MODES).includes(body.mode as never)) {
      throw createValidationError(`mode must be one of: ${Object.values(ENTITY_MODES).join(", ")}`);
    }
  }

  return body as {
    name?: string;
    contact?: string;
    location?: string;
    value?: number;
    status?: string;
    mode?: string;
  };
};

export const validateCreateEntityPayload = (payload: unknown) => {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw createValidationError("Request body must be a JSON object");
  }

  const schema = z
    .object({
      type: z.enum([ENTITY_TYPES.CUSTOMER, ENTITY_TYPES.SUPPLIER]),
      name: z.string().trim().min(1, "name is required"),
      contact: z.string().trim().min(1, "contact is required"),
      location: z.string().trim().min(1, "location is required"),
      value: z.number().finite().min(0).default(0),
      status: z.string().trim().min(1).default("Approved"),
      mode: z.enum([ENTITY_MODES.ACTIVE, ENTITY_MODES.INACTIVE]).default(ENTITY_MODES.ACTIVE)
    })
    .strict();

  try {
    return schema.parse(payload);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw createValidationError(error.issues[0]?.message ?? "Invalid create payload");
    }
    throw error;
  }
};
