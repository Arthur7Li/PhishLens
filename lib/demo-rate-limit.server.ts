/**
 * @file lib/demo-rate-limit.server.ts
 *
 * Best-effort in-memory limits for the public Groq demo. This intentionally has
 * no database or persistence; Vercel instances do not share this state, so the
 * limits are per runtime instance rather than a globally durable protection.
 */

import "server-only";

export const REQUESTS_PER_IP_PER_MINUTE = 2;
export const REQUESTS_PER_IP_PER_DAY = 10;
export const DEMO_REQUESTS_PER_DAY = 50;

const MINUTE_MS = 60_000;
const stateKey = "__phishLensDemoRateLimitState__";

type IpUsage = {
  minuteTimestamps: number[];
  dayCount: number;
};

type RateLimitState = {
  dayKey: string;
  demoDayCount: number;
  byIp: Map<string, IpUsage>;
};

export type RateLimitResult =
  | { allowed: true }
  | { allowed: false; reason: "per-minute" | "per-day" | "demo-day" };

/** Uses a UTC calendar day so daily caps behave consistently across deployments. */
function getUtcDayKey(now: Date): string {
  return now.toISOString().slice(0, 10);
}

/** Retrieves the process-local state without writing user data to disk or a service. */
function getState(now: Date): RateLimitState {
  const root = globalThis as typeof globalThis & { [stateKey]?: RateLimitState };
  const currentDay = getUtcDayKey(now);
  const existing = root[stateKey];

  if (!existing || existing.dayKey !== currentDay) {
    const fresh: RateLimitState = { dayKey: currentDay, demoDayCount: 0, byIp: new Map() };
    root[stateKey] = fresh;
    return fresh;
  }

  return existing;
}

/**
 * Checks and consumes one live-provider allowance atomically within one runtime
 * instance. Static fallback responses never call this function.
 */
export function checkAndConsumeDemoRequest(ip: string, now = new Date()): RateLimitResult {
  const state = getState(now);
  const timestamp = now.getTime();
  const usage = state.byIp.get(ip) ?? { minuteTimestamps: [], dayCount: 0 };
  usage.minuteTimestamps = usage.minuteTimestamps.filter((item) => item > timestamp - MINUTE_MS);

  if (usage.minuteTimestamps.length >= REQUESTS_PER_IP_PER_MINUTE) {
    state.byIp.set(ip, usage);
    return { allowed: false, reason: "per-minute" };
  }

  if (usage.dayCount >= REQUESTS_PER_IP_PER_DAY) {
    state.byIp.set(ip, usage);
    return { allowed: false, reason: "per-day" };
  }

  if (state.demoDayCount >= DEMO_REQUESTS_PER_DAY) {
    state.byIp.set(ip, usage);
    return { allowed: false, reason: "demo-day" };
  }

  usage.minuteTimestamps.push(timestamp);
  usage.dayCount += 1;
  state.demoDayCount += 1;
  state.byIp.set(ip, usage);
  return { allowed: true };
}

/** Extracts a bounded, non-persistent client identifier from Vercel's forwarded header. */
export function getClientIp(forwardedFor: string | null, realIp: string | null): string {
  const candidate = (forwardedFor?.split(",")[0] ?? realIp ?? "anonymous").trim();
  return /^[0-9a-f:.]{1,64}$/i.test(candidate) ? candidate : "anonymous";
}

/** Test-only helper that clears the process-local state. */
export function resetDemoRateLimitForTests(): void {
  const root = globalThis as typeof globalThis & { [stateKey]?: RateLimitState };
  delete root[stateKey];
}
