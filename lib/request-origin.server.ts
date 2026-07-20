/**
 * @file lib/request-origin.server.ts
 *
 * Same-origin protection for state-changing PhishLens routes. The helper uses
 * the request URL rather than a configured public URL, keeping the deployment
 * free of an additional environment variable.
 */

import "server-only";

/** Returns true only for a POST carrying an Origin that exactly matches the request origin. */
export function isSameOriginPost(request: Request): boolean {
  if (request.method !== "POST") return false;

  const origin = request.headers.get("origin");

  if (!origin) return false;

  try {
    return new URL(origin).origin === new URL(request.url).origin;
  } catch {
    return false;
  }
}
