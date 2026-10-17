import { createHmac, timingSafeEqual } from "node:crypto";

export const ADMIN_SESSION_COOKIE = "hbca-admin-session";
export const ADMIN_SESSION_MAX_AGE = 60 * 60 * 8;

function getAuthSecret() {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("AUTH_SECRET must be configured with at least 32 characters");
  }
  return secret;
}

function isLocalHostname(host: string | null) {
  if (!host) return false;

  try {
    const hostname = new URL(`http://${host}`).hostname.toLowerCase();
    return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "[::1]";
  } catch {
    return false;
  }
}

export function isLocalAdminHost(host: string | null, forwardedHost?: string | null) {
  return isLocalHostname(host) && (!forwardedHost || isLocalHostname(forwardedHost));
}

export function verifyAdminPassword(password: string) {
  const configuredPassword = process.env.ADMIN_PASSWORD;
  if (!configuredPassword) return false;

  const providedHash = createHmac("sha256", getAuthSecret()).update(password).digest();
  const configuredHash = createHmac("sha256", getAuthSecret()).update(configuredPassword).digest();
  return timingSafeEqual(providedHash, configuredHash);
}

export function createAdminSession() {
  const expiresAt = Date.now() + ADMIN_SESSION_MAX_AGE * 1000;
  const payload = Buffer.from(JSON.stringify({ expiresAt })).toString("base64url");
  const signature = createHmac("sha256", getAuthSecret()).update(payload).digest("base64url");
  return `${payload}.${signature}`;
}

export function isValidAdminSession(token: string | undefined) {
  if (!token) return false;

  const [payload, signature] = token.split(".");
  if (!payload || !signature) return false;

  const expectedSignature = createHmac("sha256", getAuthSecret()).update(payload).digest();
  const actualSignature = Buffer.from(signature, "base64url");
  if (actualSignature.length !== expectedSignature.length || !timingSafeEqual(actualSignature, expectedSignature)) {
    return false;
  }

  try {
    const session: unknown = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    return (
      typeof session === "object" &&
      session !== null &&
      "expiresAt" in session &&
      typeof session.expiresAt === "number" &&
      session.expiresAt > Date.now()
    );
  } catch {
    return false;
  }
}
