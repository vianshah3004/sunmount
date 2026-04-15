import { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { sendError } from "../apiResponse";
import { logger } from "../logger";
import { AppError, isAppError } from "./AppError";

export const errorHandler = (
  error: unknown,
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  const requestId = String(res.locals.requestId ?? "unknown");

  if (error instanceof ZodError) {
    logger.error("Validation error", {
      requestId,
      method: req.method,
      path: req.path,
      issues: error.errors
    });

    return sendError(
      res,
      400,
      "Invalid request data",
      "VALIDATION_ERROR",
      [...error.errors, { requestId }]
    );
  }

  const normalizedError = isAppError(error)
    ? error
    : new AppError("Something went wrong", 500, "INTERNAL_SERVER_ERROR");

  const logPayload = {
    requestId,
    method: req.method,
    path: req.path,
    message: normalizedError.message,
    stack: normalizedError.stack,
    details: normalizedError.details,
    rawError: isAppError(error)
      ? null
      : {
          name: (error as { name?: string })?.name,
          message: (error as { message?: string })?.message,
          stack: (error as { stack?: string })?.stack
        }
  };

  if (isAppError(error) && normalizedError.status < 500) {
    logger.warn("Application warning", logPayload);
  } else {
    logger.error("Unhandled application error", logPayload);
  }

  return sendError(
    res,
    normalizedError.status,
    normalizedError.message,
    normalizedError.type,
    [normalizedError.details ?? null, { requestId }]
  );
};
