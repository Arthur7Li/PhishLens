/** @file Unit tests for the documented in-memory, per-runtime demo limiter. */

import { afterEach, describe, expect, it } from "vitest";
import {
  DEMO_REQUESTS_PER_DAY,
  checkAndConsumeDemoRequest,
  getClientIp,
  resetDemoRateLimitForTests,
} from "./demo-rate-limit.server";

afterEach(() => resetDemoRateLimitForTests());

describe("checkAndConsumeDemoRequest", () => {
  it("allows two requests per IP per minute and blocks a third", () => {
    const now = new Date("2026-07-18T12:00:00.000Z");

    expect(checkAndConsumeDemoRequest("203.0.113.7", now)).toEqual({ allowed: true });
    expect(checkAndConsumeDemoRequest("203.0.113.7", now)).toEqual({ allowed: true });
    expect(checkAndConsumeDemoRequest("203.0.113.7", now)).toEqual({ allowed: false, reason: "per-minute" });
  });

  it("blocks an IP after ten requests in one UTC day", () => {
    const start = new Date("2026-07-18T00:00:00.000Z").getTime();

    for (let index = 0; index < 10; index += 1) {
      expect(checkAndConsumeDemoRequest("203.0.113.8", new Date(start + index * 61_000))).toEqual({ allowed: true });
    }

    expect(checkAndConsumeDemoRequest("203.0.113.8", new Date(start + 10 * 61_000))).toEqual({ allowed: false, reason: "per-day" });
  });

  it("blocks the runtime instance after fifty live requests and resets on a new UTC day", () => {
    const start = new Date("2026-07-18T12:00:00.000Z").getTime();

    for (let index = 0; index < DEMO_REQUESTS_PER_DAY; index += 1) {
      expect(checkAndConsumeDemoRequest(`203.0.113.${index + 1}`, new Date(start))).toEqual({ allowed: true });
    }

    expect(checkAndConsumeDemoRequest("198.51.100.1", new Date(start))).toEqual({ allowed: false, reason: "demo-day" });
    expect(checkAndConsumeDemoRequest("198.51.100.1", new Date("2026-07-19T00:00:00.000Z"))).toEqual({ allowed: true });
  });

  it("uses only a bounded first forwarded address and falls back for invalid values", () => {
    expect(getClientIp("203.0.113.9, 10.0.0.1", null)).toBe("203.0.113.9");
    expect(getClientIp("not an IP", null)).toBe("anonymous");
  });
});
