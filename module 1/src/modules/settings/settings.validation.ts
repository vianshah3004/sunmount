import { z } from "zod";

const allowedSecurityFields = ["sharedLoginEnabled", "httpsEnabled", "encryptionAtRest", "backupsEnabled"] as const;
const allowedSyncFields = ["status", "apiLatencyMs", "lastSyncAt", "backupWindow"] as const;
const allowedSyncStatuses = ["Live", "Degraded", "Offline"] as const;

export const settingsUpdateSchema = z
  .object({
    organization: z.string().trim().min(1).optional(),
    primaryContactEmail: z.string().trim().email().optional(),
    currency: z.string().trim().min(1).optional(),
    timezone: z.string().trim().min(1).optional(),
    companyInfo: z
      .object({
        name: z.string().trim().min(1).optional(),
        gstin: z.string().trim().min(1).optional(),
        address: z.string().trim().min(1).optional(),
        phone: z.string().trim().min(1).optional()
      })
      .partial()
      .optional(),
    tax: z
      .object({
        gstRate: z.number().nonnegative().max(100).optional(),
        inclusivePricing: z.boolean().optional()
      })
      .partial()
      .optional(),
    units: z
      .object({
        weightUnit: z.string().trim().min(1).optional(),
        quantityUnit: z.string().trim().min(1).optional()
      })
      .partial()
      .optional(),
    preferences: z
      .object({
        defaultOrderPageSize: z.number().int().positive().max(500).optional(),
        enableRealtimeSync: z.boolean().optional(),
        backupFrequency: z.string().trim().min(1).optional()
      })
      .partial()
      .optional(),
    notificationsEnabled: z.boolean().optional(),
    securityFlags: z
      .object({
        sharedLoginEnabled: z.boolean().optional(),
        httpsEnabled: z.boolean().optional(),
        encryptionAtRest: z.string().trim().min(1).optional(),
        backupsEnabled: z.boolean().optional()
      })
      .partial()
      .optional(),
    sync: z
      .object({
        status: z.enum(allowedSyncStatuses).optional(),
        apiLatencyMs: z.number().nonnegative().optional(),
        lastSyncAt: z.string().min(1).optional(),
        backupWindow: z.string().min(1).optional()
      })
      .partial()
      .optional()
  })
  .strict()
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one settings field must be provided"
  });

export const validateSettingsPayload = (payload: unknown) => {
  const result = settingsUpdateSchema.safeParse(payload);
  if (!result.success) {
    const error = new Error(result.error.issues.map((issue) => issue.message).join(". ")) as Error & {
      statusCode: number;
    };
    error.statusCode = 400;
    throw error;
  }

  const body = result.data;

  if (body.securityFlags) {
    const unknown = Object.keys(body.securityFlags).filter(
      (key) => !allowedSecurityFields.includes(key as (typeof allowedSecurityFields)[number])
    );
    if (unknown.length > 0) {
      const error = new Error(`Unknown securityFlags field(s): ${unknown.join(", ")}`) as Error & {
        statusCode: number;
      };
      error.statusCode = 400;
      throw error;
    }
  }

  if (body.sync) {
    const unknown = Object.keys(body.sync).filter(
      (key) => !allowedSyncFields.includes(key as (typeof allowedSyncFields)[number])
    );
    if (unknown.length > 0) {
      const error = new Error(`Unknown sync field(s): ${unknown.join(", ")}`) as Error & {
        statusCode: number;
      };
      error.statusCode = 400;
      throw error;
    }
  }

  return body;
};
