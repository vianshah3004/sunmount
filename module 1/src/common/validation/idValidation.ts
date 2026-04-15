/**
 * Validation utilities for IDs and identifiers
 */

// UUID v4 regex pattern
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Validate if a string is a valid UUID v4
 */
export const isValidUUID = (value: unknown): boolean => {
  if (typeof value !== "string") {
    return false;
  }
  return UUID_PATTERN.test(value);
};

/**
 * Validate UUID and throw AppError if invalid
 */
export const validateUUID = (value: unknown, fieldName: string = "id"): string => {
  const str = String(value);
  if (!isValidUUID(str)) {
    const { AppError } = require("../errors/AppError");
    throw new AppError(`Invalid ${fieldName} format`, 400, "VALIDATION_ERROR", {
      field: fieldName,
      received: str,
      expected: "valid UUID v4"
    });
  }
  return str;
};
