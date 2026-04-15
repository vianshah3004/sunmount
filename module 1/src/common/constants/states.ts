/**
 * Order and Manufacturing State Constants and Mapping
 * Ensures single source of truth for state values across the system
 */

// ============== ERP ORDER STATUSES ==============
export const ERP_ORDER_STATUS = {
  DRAFT: "DRAFT",
  QUOTATION: "QUOTATION",
  APPROVED: "APPROVED",
  PACKING: "PACKING",
  DISPATCHED: "DISPATCHED",
  COMPLETED: "COMPLETED",
  ON_HOLD: "ON_HOLD",
  CANCELLED: "CANCELLED"
} as const;

export type ErpOrderStatusType = typeof ERP_ORDER_STATUS[keyof typeof ERP_ORDER_STATUS];

// ============== MANUFACTURING STATUSES ==============
export const MANUFACTURING_STATUS = {
  IN_PROGRESS: "IN_PROGRESS",
  COMPLETED: "COMPLETED",
  CANCELLED: "CANCELLED"
} as const;

export type ManufacturingStatusType = typeof MANUFACTURING_STATUS[keyof typeof MANUFACTURING_STATUS];

// ============== PAYMENT STATUSES ==============
export const PAYMENT_STATUS = {
  UNPAID: "UNPAID",
  PARTIALLY_PAID: "PARTIALLY_PAID",
  PAID: "PAID",
  REFUNDED: "REFUNDED"
} as const;

export type PaymentStatusType = typeof PAYMENT_STATUS[keyof typeof PAYMENT_STATUS];

// ============== PRODUCT/ITEM STATE MAPPING ==============
// Maps product-oriented state names to backend states
// Used for frontend compatibility
export const PRODUCT_STATE_TO_BACKEND = {
  // Sales flow mapping
  CONFIRMED: "APPROVED", // Frontend "confirmed" maps to backend "approved"
  DELIVERED: "COMPLETED", // Frontend "delivered" maps to backend "completed"
  DRAFT: "DRAFT",
  QUOTATION: "QUOTATION",
  PACKING: "PACKING",
  DISPATCHED: "DISPATCHED",
  COMPLETED: "COMPLETED",
  
  // Manufacturing
  IN_PROGRESS: "IN_PROGRESS",
  CANCELLED: "CANCELLED"
} as const;

export const BACKEND_TO_PRODUCT_STATE = {
  // Reverse mapping for response transformation
  DRAFT: "DRAFT",
  QUOTATION: "QUOTATION",
  APPROVED: "CONFIRMED", // Backend "approved" displays as "confirmed" to frontend
  PACKING: "PACKING",
  DISPATCHED: "DISPATCHED",
  COMPLETED: "DELIVERED", // Backend "completed" displays as "delivered" to frontend
  ON_HOLD: "ON_HOLD",
  CANCELLED: "CANCELLED",
  IN_PROGRESS: "IN_PROGRESS"
} as const;

/**
 * Map product state to backend state
 */
export const mapProductStateTOBackend = (productState: string): ErpOrderStatusType => {
  const mapped = PRODUCT_STATE_TO_BACKEND[productState as keyof typeof PRODUCT_STATE_TO_BACKEND];
  return (mapped ?? productState) as ErpOrderStatusType;
};

/**
 * Map backend state to product state for frontend response
 */
export const mapBackendStateToProduct = (backendState: string): string => {
  return BACKEND_TO_PRODUCT_STATE[backendState as keyof typeof BACKEND_TO_PRODUCT_STATE] ?? backendState;
};

// ============== ALLOWED STATE TRANSITIONS ==============
export const ALLOWED_TRANSITIONS: Record<ErpOrderStatusType, ErpOrderStatusType[]> = {
  DRAFT: ["QUOTATION", "ON_HOLD", "CANCELLED"],
  QUOTATION: ["APPROVED", "ON_HOLD", "CANCELLED"],
  APPROVED: ["PACKING", "ON_HOLD", "CANCELLED"],
  PACKING: ["DISPATCHED", "ON_HOLD", "CANCELLED"],
  DISPATCHED: ["COMPLETED"],
  COMPLETED: [],
  ON_HOLD: ["DRAFT", "QUOTATION", "APPROVED", "PACKING", "CANCELLED"],
  CANCELLED: []
};

// ============== LOG/EXPORT FOR DEBUGGING ==============
export const logStateConstants = () => {
  return {
    productToBackend: PRODUCT_STATE_TO_BACKEND,
    backendToProduct: BACKEND_TO_PRODUCT_STATE,
    transitions: ALLOWED_TRANSITIONS
  };
};
