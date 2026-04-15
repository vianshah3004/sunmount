import { Response } from "express";

type PaginationInput = {
  page: number;
  limit: number;
  total: number;
};

type SuccessInput<T> = {
  data: T;
  message?: string;
  status?: number;
  pagination?: PaginationInput;
};

export const sendSuccess = <T>(res: Response, input: SuccessInput<T>) => {
  const { data, message, status = 200, pagination } = input;

  return res.status(status).json({
    success: true,
    message: message ?? null,
    data,
    meta: pagination ? { pagination } : null,
    error: null
  });
};

export const buildErrorBody = (message: string, code: string, details: unknown[] = []) => ({
  success: false,
  message,
  data: null,
  error: {
    code,
    details
  }
});

export const sendError = (
  res: Response,
  status: number,
  message: string,
  code: string,
  details: unknown[] = []
) => {
  return res.status(status).json(buildErrorBody(message, code, details));
};
