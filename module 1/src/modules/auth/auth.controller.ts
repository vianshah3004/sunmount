import { NextFunction, Request, Response } from "express";
import { sendSuccess } from "../../common/apiResponse";
import { AppError } from "../../common/errors/AppError";
import { auditService } from "../audit/audit.service";
import { loginSchema, signupSchema } from "./auth.validation";
import { authService } from "./auth.service";

export const authController = {
  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const payload = loginSchema.parse(req.body);
      const result = await authService.login(payload.username, payload.password, {
        ipAddress: req.ip,
        userAgent: req.get("user-agent") ?? undefined
      });

      return sendSuccess(res, {
        message: "Login successful",
        data: result
      });
    } catch (error) {
      return next(error);
    }
  },

  async signup(req: Request, res: Response, next: NextFunction) {
    try {
      const payload = signupSchema.parse(req.body);
      const result = await authService.signup(payload, {
        ipAddress: req.ip,
        userAgent: req.get("user-agent") ?? undefined
      });

      return sendSuccess(res, {
        message: "Signup successful",
        status: 201,
        data: result
      });
    } catch (error) {
      return next(error);
    }
  },

  async logout(req: Request, res: Response, next: NextFunction) {
    try {
      const startedAt = Date.now();
      const authHeader = req.header("authorization");
      const bearerToken = authHeader?.startsWith("Bearer ") ? authHeader.slice("Bearer ".length).trim() : "";
      if (!bearerToken) {
        throw new AppError("Missing bearer token", 401, "UNAUTHORIZED");
      }

      const payload = authService.verifyToken(bearerToken);
      await authService.logout(payload.sessionId);

      if (payload.sessionId && payload.sub && payload.username) {
        void auditService.recordActivity({
          sessionId: payload.sessionId,
          userId: payload.sub,
          username: payload.username,
          method: "POST",
          route: "/api/auth/logout",
          statusCode: 200,
          durationMs: Date.now() - startedAt,
          ipAddress: req.ip,
          userAgent: req.get("user-agent") ?? undefined,
          details: { event: "LOGOUT" }
        }).catch((error) => {
          // best-effort audit persistence
          void error;
        });
      }

      return sendSuccess(res, {
        message: "Logout successful",
        data: { loggedOut: true }
      });
    } catch (error) {
      return next(error);
    }
  }
};
