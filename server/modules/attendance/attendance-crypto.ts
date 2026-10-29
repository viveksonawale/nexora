import crypto from "crypto";

// Rotation window configured to 7 seconds (within the 6 to 7 sec requirement)
export const ROTATION_WINDOW_MS = 7000;

export interface TokenPayload {
  sessionId: string;
  window: number;
  hmac: string;
}

/**
 * Generates a cryptographically secure 32-byte unguessable display key
 * and its SHA-256 hash. The plain display key is only returned once upon creation/regeneration.
 */
export function generateDisplayKey(): { displayKey: string; displayKeyHash: string } {
  const displayKey = crypto.randomBytes(32).toString("hex");
  const displayKeyHash = hashDisplayKey(displayKey);
  return { displayKey, displayKeyHash };
}

/**
 * Hashes a display key with SHA-256
 */
export function hashDisplayKey(displayKey: string): string {
  return crypto.createHash("sha256").update(displayKey, "utf8").digest("hex");
}

/**
 * Constant-time comparison to verify a display key against its stored SHA-256 hash
 */
export function verifyDisplayKey(displayKey: string, storedHash: string): boolean {
  if (!displayKey || !storedHash) return false;
  const computedHash = hashDisplayKey(displayKey);
  const bufA = Buffer.from(computedHash, "utf8");
  const bufB = Buffer.from(storedHash, "utf8");
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

/**
 * Generates a cryptographically random session secret (HMAC key)
 */
export function generateSessionSecret(): string {
  return crypto.randomBytes(32).toString("hex");
}

/**
 * Computes the time window for a given server timestamp
 */
export function computeWindow(serverTimeMs: number = Date.now()): number {
  return Math.floor(serverTimeMs / ROTATION_WINDOW_MS);
}

/**
 * Computes remaining milliseconds until the next token rotation
 */
export function computeTimeToNextRotation(serverTimeMs: number = Date.now()): {
  msRemaining: number;
  secondsRemaining: number;
} {
  const elapsedInWindow = serverTimeMs % ROTATION_WINDOW_MS;
  const msRemaining = ROTATION_WINDOW_MS - elapsedInWindow;
  const secondsRemaining = Math.max(1, Math.ceil(msRemaining / 1000));
  return { msRemaining, secondsRemaining };
}

/**
 * Generates an opaque rotating QR token for a session at the given window
 */
export function generateAttendanceToken(
  sessionId: string,
  sessionSecret: string,
  serverTimeMs: number = Date.now()
): { token: string; window: number; secondsRemaining: number } {
  const window = computeWindow(serverTimeMs);
  const data = `${sessionId}:${window}`;
  const hmac = crypto.createHmac("sha256", sessionSecret).update(data, "utf8").digest("hex");

  // Opaque string payload: base64url encoded
  const opaquePayload = Buffer.from(`${sessionId}:${window}:${hmac}`, "utf8").toString("base64url");
  const { secondsRemaining } = computeTimeToNextRotation(serverTimeMs);

  return { token: opaquePayload, window, secondsRemaining };
}

/**
 * Decodes and validates an attendance QR token against current server time.
 * Accepts the current window (W0) and the previous window (W0 - 1) as grace period.
 */
export function verifyAttendanceToken(
  tokenString: string,
  sessionSecret: string,
  serverTimeMs: number = Date.now()
): { valid: boolean; sessionId?: string; window?: number; error?: string } {
  if (!tokenString || typeof tokenString !== "string") {
    return { valid: false, error: "Missing or invalid token format" };
  }

  let decoded: string;
  try {
    decoded = Buffer.from(tokenString, "base64url").toString("utf8");
  } catch {
    return { valid: false, error: "Failed to decode attendance token" };
  }

  const parts = decoded.split(":");
  if (parts.length !== 3) {
    return { valid: false, error: "Malformed attendance token payload" };
  }

  const [sessionId, windowStr, tokenHmac] = parts;
  const window = parseInt(windowStr, 10);
  if (isNaN(window)) {
    return { valid: false, error: "Invalid window in token" };
  }

  const currentWindow = computeWindow(serverTimeMs);
  const previousWindow = currentWindow - 1;

  // Reject if token is from a future window or older than previous window
  if (window !== currentWindow && window !== previousWindow) {
    return {
      valid: false,
      sessionId,
      window,
      error: window < previousWindow ? "Token has expired" : "Token is from future window",
    };
  }

  // Verify HMAC using constant-time comparison
  const expectedHmac = crypto
    .createHmac("sha256", sessionSecret)
    .update(`${sessionId}:${window}`, "utf8")
    .digest("hex");

  const bufToken = Buffer.from(tokenHmac, "utf8");
  const bufExpected = Buffer.from(expectedHmac, "utf8");

  if (bufToken.length !== bufExpected.length || !crypto.timingSafeEqual(bufToken, bufExpected)) {
    return { valid: false, sessionId, window, error: "Invalid token signature" };
  }

  return { valid: true, sessionId, window };
}
