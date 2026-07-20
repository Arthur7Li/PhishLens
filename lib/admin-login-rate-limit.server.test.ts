/** @file No-network tests for the bounded, process-local administrator login limiter. */

import { afterEach, describe, expect, it } from "vitest";
import {
  LOGIN_FAILURE_WINDOW_MS,
  MAX_FAILED_LOGIN_ATTEMPTS,
  canAttemptAdminLogin,
  clearFailedAdminLogins,
  recordFailedAdminLogin,
  resetAdminLoginRateLimitForTests,
} from "./admin-login-rate-limit.server";

afterEach(() => resetAdminLoginRateLimitForTests());

describe("administrator login rate limit", () => {
  it("blocks the sixth failed attempt in a fifteen-minute window and expires old failures", () => {
    const ip = "203.0.113.20";
    const now = 1_752_840_000_000;

    for (let attempt = 0; attempt < MAX_FAILED_LOGIN_ATTEMPTS; attempt += 1) {
      expect(canAttemptAdminLogin(ip, now)).toBe(true);
      recordFailedAdminLogin(ip, now);
    }

    expect(canAttemptAdminLogin(ip, now)).toBe(false);
    expect(canAttemptAdminLogin(ip, now + LOGIN_FAILURE_WINDOW_MS + 1)).toBe(true);
  });

  it("clears the recorded failures after a successful authentication", () => {
    const ip = "203.0.113.21";

    recordFailedAdminLogin(ip, 1_752_840_000_000);
    clearFailedAdminLogins(ip);

    expect(canAttemptAdminLogin(ip, 1_752_840_000_000)).toBe(true);
  });
});
