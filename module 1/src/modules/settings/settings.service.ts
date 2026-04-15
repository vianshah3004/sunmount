import { eq } from "drizzle-orm";
import { decryptSensitiveObject, encryptSensitiveObject } from "../../common/security/encryption";
import { db } from "../../db";
import { settings } from "../../db/schema";
import { validateSettingsPayload } from "./settings.validation";

const DEFAULT_SETTINGS = {
  organization: "Sunmount Industries",
  primaryContactEmail: "ops@sunmount.example",
  currency: "INR",
  timezone: "Asia/Kolkata",
  notificationsEnabled: true,
  securityFlags: {
    sharedLoginEnabled: false,
    httpsEnabled: true,
    encryptionAtRest: "AES-256",
    backupsEnabled: true
  },
  sync: {
    status: "Live",
    apiLatencyMs: 118,
    lastSyncAt: new Date().toISOString(),
    backupWindow: "02:00-03:00 IST",
    companyInfo: {
      name: "Sunmount Industries",
      gstin: "",
      address: "",
      phone: ""
    },
    tax: {
      gstRate: 18,
      inclusivePricing: false
    },
    units: {
      weightUnit: "kg",
      quantityUnit: "pcs"
    },
    preferences: {
      defaultOrderPageSize: 50,
      enableRealtimeSync: true,
      backupFrequency: "daily"
    }
  }
} as const;

const singletonId = 1;

const toSettingsView = (row: typeof settings.$inferSelect) => ({
  ...decryptSensitiveObject({ ...(row.sync as Record<string, unknown>) }),
  organization: row.organization,
  primaryContactEmail: row.primaryContactEmail,
  currency: row.currency,
  timezone: row.timezone,
  notificationsEnabled: row.notificationsEnabled,
  securityFlags: decryptSensitiveObject({ ...(row.securityFlags as Record<string, unknown>) }),
  sync: decryptSensitiveObject({ ...(row.sync as Record<string, unknown>) })
});

const ensureSettingsRow = async () => {
  const [existing] = await db.select().from(settings).where(eq(settings.id, singletonId)).limit(1);
  if (existing) {
    return existing;
  }

  const [inserted] = await db
    .insert(settings)
    .values({
      id: singletonId,
      organization: DEFAULT_SETTINGS.organization,
      primaryContactEmail: DEFAULT_SETTINGS.primaryContactEmail,
      currency: DEFAULT_SETTINGS.currency,
      timezone: DEFAULT_SETTINGS.timezone,
      notificationsEnabled: DEFAULT_SETTINGS.notificationsEnabled,
      securityFlags: DEFAULT_SETTINGS.securityFlags as Record<string, unknown>,
      sync: DEFAULT_SETTINGS.sync as Record<string, unknown>
    })
    .returning();

  return inserted;
};

export const settingsService = {
  async getSettings() {
    const row = await ensureSettingsRow();
    return toSettingsView(row);
  },

  async updateSettings(payload: unknown) {
    const validated = validateSettingsPayload(payload) as Record<string, unknown>;
    const current = await ensureSettingsRow();

    const nextSecurityFlags = validated.securityFlags
      ? {
          ...(current.securityFlags as Record<string, unknown>),
          ...(validated.securityFlags as Record<string, unknown>)
        }
      : (current.securityFlags as Record<string, unknown>);

    const nextSync = validated.sync
      ? {
          ...(current.sync as Record<string, unknown>),
          ...(validated.sync as Record<string, unknown>)
        }
      : (current.sync as Record<string, unknown>);

    const nextSyncWithDomains = {
      ...nextSync,
      ...(validated.companyInfo ? { companyInfo: { ...(nextSync.companyInfo as Record<string, unknown> ?? {}), ...(validated.companyInfo as Record<string, unknown>) } } : {}),
      ...(validated.tax ? { tax: { ...(nextSync.tax as Record<string, unknown> ?? {}), ...(validated.tax as Record<string, unknown>) } } : {}),
      ...(validated.units ? { units: { ...(nextSync.units as Record<string, unknown> ?? {}), ...(validated.units as Record<string, unknown>) } } : {}),
      ...(validated.preferences ? { preferences: { ...(nextSync.preferences as Record<string, unknown> ?? {}), ...(validated.preferences as Record<string, unknown>) } } : {})
    };

    const encryptedSecurityFlags = encryptSensitiveObject(nextSecurityFlags);
    const encryptedSync = encryptSensitiveObject(nextSyncWithDomains);

    const [updated] = await db
      .update(settings)
      .set({
        ...(validated.organization ? { organization: validated.organization as string } : {}),
        ...(validated.primaryContactEmail ? { primaryContactEmail: validated.primaryContactEmail as string } : {}),
        ...(validated.currency ? { currency: validated.currency as string } : {}),
        ...(validated.timezone ? { timezone: validated.timezone as string } : {}),
        ...(validated.notificationsEnabled !== undefined
          ? { notificationsEnabled: validated.notificationsEnabled as boolean }
          : {}),
        securityFlags: encryptedSecurityFlags,
        sync: encryptedSync,
        updatedAt: new Date()
      })
      .where(eq(settings.id, singletonId))
      .returning();

    return toSettingsView(updated);
  },

  async getHealth() {
    const settingsRow = await this.getSettings();

    return {
      status: "OK",
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      sync: {
        ...settingsRow.sync
      }
    };
  }
};
