/** @file No-secret tests for the jose-backed administrator session helpers. */

import { describe, expect, it } from "vitest";
import {
  ADMIN_SESSION_MAX_AGE_SECONDS,
  getAdminSessionCookieOptions,
  hasValidAdminSession,
  issueAdminSession,
  timingSafePasswordMatch,
} from "./admin-session.server";

const sessionKey = new Uint8Array(32).fill(7);

describe("administrator session helpers", () => {
  it("issues a signed single-admin session that verifies only with the matching key", async () => {
    const session = await issueAdminSession(sessionKey);

    await expect(hasValidAdminSession(session, sessionKey)).resolves.toBe(true);
    await expect(hasValidAdminSession(session, new Uint8Array(32).fill(8))).resolves.toBe(false);
  });

  it("uses strict, httpOnly cookie settings and an eight-hour maximum age", () => {
    expect(getAdminSessionCookieOptions(true)).toEqual({
      httpOnly: true,
      secure: true,
      sameSite: "strict",
      path: "/",
      maxAge: ADMIN_SESSION_MAX_AGE_SECONDS,
    });
    expect(getAdminSessionCookieOptions(false).secure).toBe(false);
  });

  it("uses a timing-safe comparison helper for both matching and non-matching input", () => {
    expect(timingSafePasswordMatch("same input", "same input")).toBe(true);
    expect(timingSafePasswordMatch("different input", "same input")).toBe(false);
  });
});
