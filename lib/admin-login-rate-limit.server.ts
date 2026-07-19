/**
 * @file lib/admin-login-rate-limit.server.ts
 *
 * Best-effort in-memory protection for the single administrator login. Vercel
 * instances do not share this process-local state, so it is intentionally
 * documented as a runtime-instance guard rather than durable account storage.
 */

import "server-only";

export const MAX_FAILED_LOGIN_ATTEMPTS = 5;
export const LOGIN_FAILURE_WINDOW_MS = 15 * 60 * 1000;

const stateKey = "__phishLensAdminLoginRateLimitState__";

type LoginRateLimitState = {
  failuresByIp: Map<string, number[]>;
};

/** Retrieves process-local failure timestamps without persisting an IP address anywhere else. */
function getState(): LoginRateLimitState {
  const root = globalThis as typeof globalThis & { [stateKey]?: LoginRateLimitState };

  if (!root[stateKey]) root[stateKey] = { failuresByIp: new Map() };

  return root[stateKey];
}

/** Removes failure timestamps that have aged out of the rolling fifteen-minute window. */
function getRecentFailures(ip: string, now: number): number[] {
  const state = getState();
  const recent = (state.failuresByIp.get(ip) ?? []).filter((timestamp) => timestamp > now - LOGIN_FAILURE_WINDOW_MS);
  state.failuresByIp.set(ip, recent);
  return recent;
}

/** Checks whether an IP can make another password attempt without revealing rate-limit state to clients. */
export function canAttemptAdminLogin(ip: string, now = Date.now()): boolean {
  return getRecentFailures(ip, now).length < MAX_FAILED_LOGIN_ATTEMPTS;
}

/** Records one unsuccessful administrator password attempt in the current runtime instance. */
export function recordFailedAdminLogin(ip: string, now = Date.now()): void {
  const state = getState();
  const failures = getRecentFailures(ip, now);
  failures.push(now);
  state.failuresByIp.set(ip, failures);
}

/** Clears a successful administrator's recent failures so a correct login restores normal access. */
export function clearFailedAdminLogins(ip: string): void {
  getState().failuresByIp.delete(ip);
}

/** Test-only helper that removes all process-local login-rate state. */
export function resetAdminLoginRateLimitForTests(): void {
  const root = globalThis as typeof globalThis & { [stateKey]?: LoginRateLimitState };
  delete root[stateKey];
}
