export type AppErrorType =
  | "VALIDATION_ERROR"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "CONFLICT"
  | "NOT_FOUND"
  | "DUPLICATE_ENTRY"
  | "FOREIGN_KEY_ERROR"
  | "INSUFFICIENT_STOCK"
  | "BAD_REQUEST"
  | "EXTERNAL_API_ERROR"
  | "CONFIGURATION_ERROR"
  | "INTERNAL_SERVER_ERROR";

export class AppError extends Error {
  status: number;

  type: AppErrorType;

  details?: unknown;

  constructor(message: string, status: number, type: AppErrorType, details?: unknown) {
    super(message);
    this.name = "AppError";
    this.status = status;
    this.type = type;
    this.details = details;
  }
}

type DbErrorLike = {
  code?: string;
  detail?: string;
  constraint?: string;
  table?: string;
};

export const isAppError = (error: unknown): error is AppError => error instanceof AppError;

export const mapDatabaseError = (
  error: unknown,
  fallbackMessage = "Database operation failed"
): AppError => {
  const dbError = error as DbErrorLike;

  if (dbError?.code === "23505") {
    return new AppError("Duplicate entry", 400, "DUPLICATE_ENTRY", {
      detail: dbError.detail,
      constraint: dbError.constraint,
      table: dbError.table
    });
  }

  if (dbError?.code === "23503") {
    return new AppError("Invalid reference to related record", 400, "FOREIGN_KEY_ERROR", {
      detail: dbError.detail,
      constraint: dbError.constraint,
      table: dbError.table
    });
  }

  return new AppError(fallbackMessage, 500, "INTERNAL_SERVER_ERROR");
};
