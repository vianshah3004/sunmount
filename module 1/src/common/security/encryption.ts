import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import { env } from "../../config/env";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;

const deriveKey = (rawKey: string) => createHash("sha256").update(rawKey).digest();

const encryptionKey = deriveKey(env.ENCRYPTION_KEY);

export const encrypt = (plainText: string) => {
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, encryptionKey, iv);
  const encrypted = Buffer.concat([cipher.update(plainText, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();

  return [
    "enc",
    "v1",
    iv.toString("base64url"),
    tag.toString("base64url"),
    encrypted.toString("base64url")
  ].join(":");
};

export const decrypt = (cipherText: string) => {
  const parts = cipherText.split(":");
  if (parts.length !== 5 || parts[0] !== "enc" || parts[1] !== "v1") {
    return cipherText;
  }

  const [, , ivEncoded, tagEncoded, bodyEncoded] = parts;
  const iv = Buffer.from(ivEncoded, "base64url");
  const tag = Buffer.from(tagEncoded, "base64url");
  const body = Buffer.from(bodyEncoded, "base64url");

  const decipher = createDecipheriv(ALGORITHM, encryptionKey, iv);
  decipher.setAuthTag(tag);

  const plain = Buffer.concat([decipher.update(body), decipher.final()]);
  return plain.toString("utf8");
};

const SENSITIVE_KEYS = ["token", "secret", "password", "key"];

const shouldEncryptKey = (key: string) => {
  const lower = key.toLowerCase();
  return SENSITIVE_KEYS.some((pattern) => lower.includes(pattern));
};

export const encryptSensitiveObject = (input: Record<string, unknown>): Record<string, unknown> => {
  const transformed: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(input)) {
    if (value === null || value === undefined) {
      transformed[key] = value;
      continue;
    }

    if (typeof value === "string" && shouldEncryptKey(key) && !value.startsWith("enc:v1:")) {
      transformed[key] = encrypt(value);
      continue;
    }

    if (Array.isArray(value)) {
      transformed[key] = value.map((item) => {
        if (item && typeof item === "object") {
          return encryptSensitiveObject(item as Record<string, unknown>);
        }
        return item;
      });
      continue;
    }

    if (typeof value === "object") {
      transformed[key] = encryptSensitiveObject(value as Record<string, unknown>);
      continue;
    }

    transformed[key] = value;
  }

  return transformed;
};

export const decryptSensitiveObject = (input: Record<string, unknown>): Record<string, unknown> => {
  const transformed: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(input)) {
    if (typeof value === "string" && value.startsWith("enc:v1:")) {
      transformed[key] = decrypt(value);
      continue;
    }

    if (Array.isArray(value)) {
      transformed[key] = value.map((item) => {
        if (item && typeof item === "object") {
          return decryptSensitiveObject(item as Record<string, unknown>);
        }
        return item;
      });
      continue;
    }

    if (value && typeof value === "object") {
      transformed[key] = decryptSensitiveObject(value as Record<string, unknown>);
      continue;
    }

    transformed[key] = value;
  }

  return transformed;
};
