/**
 * @file lib/admin-session.server.ts
 *
 * Server-only helpers for PhishLens' single administrator session. JWT signing
 * and verification are delegated to jose; this module never exposes a session
 * secret, password, or raw token to client components.
 */

import "server-only";

import { timingSafeEqual, createHash } from "node:crypto";
import { SignJWT, jwtVerify } from "jose";

export const ADMIN_SESSION_COOKIE_NAME = "phishlens_admin_session";
export const ADMIN_SESSION_MAX_AGE_SECONDS = 8 * 60 * 60;

const ADMIN_SESSION_ISSUER = "phishlens";
const ADMIN_SESSION_AUDIENCE = "phishlens-admin";
const ADMIN_SESSION_SUBJECT = "single-admin";
const MINIMUM_SESSION_SECRET_LENGTH = 32;

/** Returns secure, strict cookie settings without exposing any environment value. */
export function getAdminSessionCookieOptions(isProduction = process.env.NODE_ENV === "production") {
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: "strict" as const,
    path: "/",
    maxAge: ADMIN_SESSION_MAX_AGE_SECONDS,
  };
}

/** Returns the corresponding settings required to clear the browser's session cookie. */
export function getClearedAdminSessionCookieOptions(isProduction = process.env.NODE_ENV === "production") {
  return { ...getAdminSessionCookieOptions(isProduction), maxAge: 0 };
}

/** Checks whether both administrator values required to issue a session are configured. */
export function isAdminAuthenticationConfigured(): boolean {
  return Boolean(process.env.ADMIN_PASSWORD) && (process.env.ADMIN_SESSION_SECRET?.length ?? 0) >= MINIMUM_SESSION_SECRET_LENGTH;
}

/** Converts the configured session secret into the symmetric key required by jose. */
function getConfiguredSessionKey(): Uint8Array {
  const secret = process.env.ADMIN_SESSION_SECRET;

  if (!secret || secret.length < MINIMUM_SESSION_SECRET_LENGTH) {
    throw new Error("Administrator session signing is unavailable.");
  }

  return new TextEncoder().encode(secret);
}

/**
 * Compares fixed-length SHA-256 digests with Node's timing-safe primitive. The
 * digest prevents a password-length mismatch from bypassing timingSafeEqual.
 */
export function timingSafePasswordMatch(candidate: string, expected: string): boolean {
  const candidateDigest = createHash("sha256").update(candidate, "utf8").digest();
  const expectedDigest = createHash("sha256").update(expected, "utf8").digest();

  return timingSafeEqual(candidateDigest, expectedDigest);
}

/** Verifies a candidate password against the server-only configured administrator password. */
export function verifyAdminPassword(candidate: string): boolean {
  const expected = process.env.ADMIN_PASSWORD;

  if (!expected) return false;

  return timingSafePasswordMatch(candidate, expected);
}

/** Issues the compact, non-identifying single-admin session payload with an eight-hour expiry. */
export async function issueAdminSession(sessionKey = getConfiguredSessionKey()): Promise<string> {
  return new SignJWT({ role: "admin" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuer(ADMIN_SESSION_ISSUER)
    .setAudience(ADMIN_SESSION_AUDIENCE)
    .setSubject(ADMIN_SESSION_SUBJECT)
    .setIssuedAt()
    .setExpirationTime(`${ADMIN_SESSION_MAX_AGE_SECONDS}s`)
    .sign(sessionKey);
}

/** Verifies signature, expiry, issuer, audience, subject, and role before granting admin status. */
export async function hasValidAdminSession(token: string | undefined, sessionKey?: Uint8Array): Promise<boolean> {
  if (!token) return false;

  try {
    const key = sessionKey ?? getConfiguredSessionKey();
    const { payload } = await jwtVerify(token, key, {
      issuer: ADMIN_SESSION_ISSUER,
      audience: ADMIN_SESSION_AUDIENCE,
    });

    return payload.sub === ADMIN_SESSION_SUBJECT && payload.role === "admin";
  } catch {
    return false;
  }
}
