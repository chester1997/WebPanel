import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from "node:crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;

function getKey(): Buffer {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error(
      "AUTH_SECRET não configurado — necessário para criptografar/descriptografar segredos de tenant."
    );
  }
  return scryptSync(secret, "webpanel-secret-encryption", 32);
}

/**
 * Encrypts a tenant-owned secret (bot token, gateway access token, ...) for storage.
 * Only ever called from the server — the result is stored in the database, never
 * sent to a client component.
 */
export function encryptSecret(plainText: string): string {
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, getKey(), iv);
  const encrypted = Buffer.concat([cipher.update(plainText, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return [iv, authTag, encrypted].map((b) => b.toString("base64")).join(".");
}

/**
 * Decrypts a secret previously stored with {@link encryptSecret}. Only the
 * backend ever calls this — never expose the decrypted value to the client.
 */
export function decryptSecret(cipherText: string): string {
  const [ivB64, authTagB64, dataB64] = cipherText.split(".");
  if (!ivB64 || !authTagB64 || !dataB64) {
    throw new Error("Formato de segredo criptografado inválido.");
  }
  const iv = Buffer.from(ivB64, "base64");
  const authTag = Buffer.from(authTagB64, "base64");
  const data = Buffer.from(dataB64, "base64");

  const decipher = createDecipheriv(ALGORITHM, getKey(), iv);
  decipher.setAuthTag(authTag);
  const decrypted = Buffer.concat([decipher.update(data), decipher.final()]);
  return decrypted.toString("utf8");
}

/** Generates a random secret used to validate the origin of Telegram webhook calls. */
export function generateWebhookSecret(): string {
  return randomBytes(24).toString("hex");
}
