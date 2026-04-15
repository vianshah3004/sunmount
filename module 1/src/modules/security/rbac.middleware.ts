import { NextFunction, Response } from "express";
import { AppError } from "../../common/errors/AppError";
import { AuthenticatedRequest, UserRole } from "./auth.middleware";

export const requireRoles = (roles: UserRole[]) => {
  return (req: AuthenticatedRequest, _res: Response, next: NextFunction) => {
    const auth = req.auth;
    if (!auth) {
      return next(new AppError("Unauthorized", 401, "UNAUTHORIZED"));
    }

    if (!roles.includes(auth.role)) {
      return next(
        new AppError("Forbidden: insufficient role", 403, "FORBIDDEN", {
          required: roles,
          current: auth.role
        })
      );
    }

    return next();
  };
};