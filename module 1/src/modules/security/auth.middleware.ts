import { NextFunction, Request, Response } from "express";
import { AppError } from "../../common/errors/AppError";
import { isAuthEnabled } from "../../config/env";
import { authService } from "../auth/auth.service";

export type UserRole = "ADMIN" | "OPERATOR" | "ACCOUNTANT";

export type AuthenticatedRequest = Request & {
  auth?: {
    userId: string;
    username: string;
    role: UserRole;
    sessionId?: string;
  };
};

const AUTH_EXEMPT_PATHS = new Set(["/health", "/auth/login"]);

export const requireAuth = (req: Request, _res: Response, next: NextFunction) => {
  if (!isAuthEnabled || AUTH_EXEMPT_PATHS.has(req.path)) {
    return next();
  }

  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return next(new AppError("Missing bearer token", 401, "UNAUTHORIZED"));
  }

  const token = authHeader.slice("Bearer ".length).trim();
  if (!token) {
    return next(new AppError("Missing bearer token", 401, "UNAUTHORIZED"));
  }

  try {
    const payload = authService.verifyToken(token);
    (req as AuthenticatedRequest).auth = {
      userId: payload.sub,
      username: payload.username,
      role: payload.role,
      sessionId: payload.sessionId
    };
    return next();
  } catch (error) {
    return next(error);
  }
};
