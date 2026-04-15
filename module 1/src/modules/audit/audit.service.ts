import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "../../db";
import { activityLogs, userSessions } from "../../db/schema";

export type AuditSessionContext = {
  userId: string;
  username: string;
  role: "ADMIN" | "OPERATOR" | "ACCOUNTANT";
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, unknown>;
};

export type AuditRequestContext = {
  sessionId: string;
  userId: string;
  username: string;
  method: string;
  route: string;
  statusCode: number;
  durationMs: number;
  ipAddress?: string;
  userAgent?: string;
  details?: Record<string, unknown>;
};

export const auditService = {
  async startSession(context: AuditSessionContext) {
    const [session] = await db
      .insert(userSessions)
      .values({
        userId: context.userId,
        username: context.username,
        role: context.role,
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
        metadata: context.metadata ?? {},
        active: true,
        createdAt: new Date(),
        lastSeenAt: new Date()
      })
      .returning();

    return session;
  },

  async endSession(sessionId: string) {
    const [session] = await db.select().from(userSessions).where(eq(userSessions.sessionId, sessionId)).limit(1);
    if (!session) {
      return null;
    }

    if (session.logoutAt) {
      return session;
    }

    const endedAt = new Date();
    const sessionDurationMs = Math.max(0, endedAt.getTime() - new Date(session.createdAt).getTime());

    const [updated] = await db
      .update(userSessions)
      .set({
        active: false,
        logoutAt: endedAt,
        lastSeenAt: endedAt,
        sessionDurationMs
      })
      .where(eq(userSessions.sessionId, sessionId))
      .returning();

    return updated;
  },

  async touchSession(sessionId: string) {
    await db
      .update(userSessions)
      .set({ lastSeenAt: new Date() })
      .where(eq(userSessions.sessionId, sessionId));
  },

  async recordActivity(context: AuditRequestContext) {
    await db.insert(activityLogs).values({
      sessionId: context.sessionId,
      userId: context.userId,
      username: context.username,
      action: `${context.method} ${context.route}`,
      route: context.route,
      method: context.method,
      statusCode: context.statusCode,
      durationMs: Math.max(0, Math.round(context.durationMs)),
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
      details: context.details ?? {},
      createdAt: new Date()
    });
  },

  async recordRequest(context: AuditRequestContext) {
    await this.recordActivity(context);
    await this.touchSession(context.sessionId);
  },

  async listSessions(userId?: string) {
    const where = userId ? eq(userSessions.userId, userId) : undefined;
    const rows = await db
      .select()
      .from(userSessions)
      .where(where ?? sql`true`)
      .orderBy(desc(userSessions.createdAt))
      .limit(100);

    return rows;
  },

  async listActivity(sessionId?: string) {
    const where = sessionId ? eq(activityLogs.sessionId, sessionId) : undefined;
    const rows = await db
      .select()
      .from(activityLogs)
      .where(where ?? sql`true`)
      .orderBy(desc(activityLogs.createdAt))
      .limit(200);

    return rows;
  }
};
