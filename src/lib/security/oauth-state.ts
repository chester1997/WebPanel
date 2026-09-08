import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

const STATE_TTL_MS = 10 * 60 * 1000; // 10 minutos

interface StatePayload {
  tenantId: string;
  nonce: string;
  exp: number;
}

function getSecret(): string {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET não configurado.");
  return secret;
}

function sign(data: string): string {
  return createHmac("sha256", getSecret()).update(data).digest("base64url");
}

/** Creates a signed, single-purpose, time-limited OAuth `state` for a tenant. */
export function createOAuthState(tenantId: string): string {
  const payload: StatePayload = {
    tenantId,
    nonce: randomBytes(16).toString("hex"),
    exp: Date.now() + STATE_TTL_MS,
  };
  const data = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = sign(data);
  return `${data}.${signature}`;
}

/** Verifies a `state` produced by {@link createOAuthState}. Returns the tenantId or null. */
export function verifyOAuthState(state: string): string | null {
  const [data, signature] = state.split(".");
  if (!data || !signature) return null;

  const expectedSignature = sign(data);
  const sigBuf = Buffer.from(signature);
  const expectedBuf = Buffer.from(expectedSignature);
  if (sigBuf.length !== expectedBuf.length || !timingSafeEqual(sigBuf, expectedBuf)) {
    return null;
  }

  try {
    const payload = JSON.parse(
      Buffer.from(data, "base64url").toString("utf8")
    ) as StatePayload;
    if (Date.now() > payload.exp) return null;
    return payload.tenantId;
  } catch {
    return null;
  }
}
