import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { eq } from "drizzle-orm";
import { AppError, mapDatabaseError } from "../../common/errors/AppError";
import { db } from "../../db";
import { users } from "../../db/schema";
import { env, isAuthEnabled } from "../../config/env";
import { logger } from "../../common/logger";
import { auditService } from "../audit/audit.service";

type JwtPayload = {
  sub: string;
  username: string;
  role: "ADMIN" | "OPERATOR" | "ACCOUNTANT";
  sessionId?: string;
};

const parseJwtExpiryToSeconds = (value: string) => {
  const trimmed = value.trim();
  if (/^\d+$/.test(trimmed)) {
    return Number(trimmed);
  }

  const match = trimmed.match(/^(\d+)([smhd])$/i);
  if (!match) {
    return 12 * 60 * 60;
  }

  const amount = Number(match[1]);
  const unit = match[2].toLowerCase();

  if (unit === "s") return amount;
  if (unit === "m") return amount * 60;
  if (unit === "h") return amount * 60 * 60;
  return amount * 60 * 60 * 24;
};

const jwtExpirySeconds = parseJwtExpiryToSeconds(env.JWT_EXPIRES_IN);

export const authService = {
  async ensureSharedUser() {
    if (!isAuthEnabled) {
      return;
    }

    if (!env.SHARED_USERNAME || !env.SHARED_PASSWORD) {
      throw new AppError("Auth is enabled but SHARED_USERNAME/SHARED_PASSWORD are missing", 500, "CONFIGURATION_ERROR");
    }

    try {
      const [existing] = await db
        .select()
        .from(users)
        .where(eq(users.username, env.SHARED_USERNAME))
        .limit(1);

      if (existing) {
        return;
      }

      const passwordHash = await bcrypt.hash(env.SHARED_PASSWORD, 12);
      await db.insert(users).values({
        username: env.SHARED_USERNAME,
        passwordHash,
        role: "ADMIN"
      });

      logger.info("Shared auth user initialized");
    } catch (error) {
      throw mapDatabaseError(error, "Failed to initialize auth user");
    }
  },

  async login(
    username: string,
    password: string,
    context?: { ipAddress?: string; userAgent?: string }
  ) {
    const startedAt = Date.now();
    try {
      const [user] = await db.select().from(users).where(eq(users.username, username)).limit(1);
      if (!user) {
        throw new AppError("Invalid credentials", 401, "UNAUTHORIZED");
      }

      const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
      if (!isPasswordValid) {
        throw new AppError("Invalid credentials", 401, "UNAUTHORIZED");
      }

      const session = await auditService.startSession({
        userId: user.id,
        username: user.username,
        role: user.role,
        metadata: {
          authMethod: "login"
        }
      });

      const token = jwt.sign({ sub: user.id, username: user.username, role: user.role, sessionId: session.sessionId }, env.JWT_SECRET, {
        expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions["expiresIn"]
      });

      void auditService.recordActivity({
        sessionId: String(session.sessionId),
        userId: user.id,
        username: user.username,
        method: "POST",
        route: "/api/auth/login",
        statusCode: 200,
        durationMs: Date.now() - startedAt,
        ipAddress: context?.ipAddress,
        userAgent: context?.userAgent,
        details: { event: "LOGIN" }
      }).catch((error) => {
        logger.error("Failed to persist login audit event", { error, username: user.username });
      });

      return {
        token,
        tokenType: "Bearer",
        expiresIn: jwtExpirySeconds,
        username: user.username,
        role: user.role,
        sessionId: session.sessionId
      };

    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }

      const dbErrorCode = (error as { code?: string })?.code;
      if (dbErrorCode) {
        throw mapDatabaseError(error, "Login failed");
      }

      logger.error("Unexpected login failure", {
        error,
        username
      });

      throw new AppError("Login failed", 500, "INTERNAL_SERVER_ERROR");
    }
  },

  async signup(input: {
    username: string;
    password: string;
    role?: "ADMIN" | "OPERATOR" | "ACCOUNTANT";
  }, context?: { ipAddress?: string; userAgent?: string }) {
    const startedAt = Date.now();
    try {
      const username = input.username.trim();
      const [existing] = await db.select().from(users).where(eq(users.username, username)).limit(1);
      if (existing) {
        throw new AppError("Username already exists", 409, "CONFLICT", {
          username
        });
      }

      const passwordHash = await bcrypt.hash(input.password, 12);
      const [created] = await db
        .insert(users)
        .values({
          username,
          passwordHash,
          role: input.role ?? "OPERATOR"
        })
        .returning();

      const session = await auditService.startSession({
        userId: created.id,
        username: created.username,
        role: created.role,
        metadata: {
          authMethod: "signup"
        }
      });

      const token = jwt.sign({ sub: created.id, username: created.username, role: created.role, sessionId: session.sessionId }, env.JWT_SECRET, {
        expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions["expiresIn"]
      });

      void auditService.recordActivity({
        sessionId: String(session.sessionId),
        userId: created.id,
        username: created.username,
        method: "POST",
        route: "/api/auth/signup",
        statusCode: 201,
        durationMs: Date.now() - startedAt,
        ipAddress: context?.ipAddress,
        userAgent: context?.userAgent,
        details: { event: "SIGNUP" }
      }).catch((error) => {
        logger.error("Failed to persist signup audit event", { error, username: created.username });
      });

      return {
        token,
        tokenType: "Bearer",
        expiresIn: jwtExpirySeconds,
        username: created.username,
        role: created.role,
        sessionId: session.sessionId
      };

    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }

      const dbErrorCode = (error as { code?: string })?.code;
      if (dbErrorCode) {
        throw mapDatabaseError(error, "Signup failed");
      }

      logger.error("Unexpected signup failure", {
        error,
        username: input.username
      });

      throw new AppError("Signup failed", 500, "INTERNAL_SERVER_ERROR");
    }
  },

  async logout(sessionId?: string) {
    if (!sessionId) {
      return null;
    }

    return auditService.endSession(sessionId);
  },

  verifyToken(token: string): JwtPayload {
    try {
      return jwt.verify(token, env.JWT_SECRET) as JwtPayload;
    } catch {
      throw new AppError("Unauthorized", 401, "UNAUTHORIZED");
    }
  }
};
