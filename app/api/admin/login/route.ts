/**
 * @file app/api/admin/login/route.ts
 *
 * Same-origin, single-password administrator login. The route intentionally
 * returns one generic authentication error for malformed, rate-limited,
 * unconfigured, and incorrect-password attempts.
 */

import { NextResponse } from "next/server";
import { z } from "zod";
import {
  clearFailedAdminLogins,
  canAttemptAdminLogin,
  recordFailedAdminLogin,
} from "@/lib/admin-login-rate-limit.server";
import {
  ADMIN_SESSION_COOKIE_NAME,
  getAdminSessionCookieOptions,
  isAdminAuthenticationConfigured,
  issueAdminSession,
  verifyAdminPassword,
} from "@/lib/admin-session.server";
import { getClientIp } from "@/lib/demo-rate-limit.server";
import { isSameOriginPost } from "@/lib/request-origin.server";

const MAX_LOGIN_REQUEST_BODY_CHARS = 1_024;
const genericAuthenticationError = "Unable to sign in. Please try again.";
const loginSchema = z.object({ password: z.string().min(1).max(512) }).strict();
const noStoreHeaders = { "Cache-Control": "no-store, max-age=0", Pragma: "no-cache" };

/** Creates a generic, non-cacheable login failure without revealing the reason. */
function authenticationFailure(status = 401): NextResponse {
  return NextResponse.json({ error: genericAuthenticationError }, { status, headers: noStoreHeaders });
}

/** Issues the administrator cookie only after same-origin and rate-limit checks succeed. */
export async function POST(request: Request): Promise<NextResponse> {
  if (!isSameOriginPost(request)) {
    return authenticationFailure(403);
  }

  const ip = getClientIp(request.headers.get("x-forwarded-for"), request.headers.get("x-real-ip"));

  if (!canAttemptAdminLogin(ip)) {
    return authenticationFailure();
  }

  let requestText: string;

  try {
    requestText = await request.text();
  } catch {
    return authenticationFailure();
  }

  if (requestText.length > MAX_LOGIN_REQUEST_BODY_CHARS) {
    recordFailedAdminLogin(ip);
    return authenticationFailure();
  }

  let body: unknown;

  try {
    body = JSON.parse(requestText);
  } catch {
    recordFailedAdminLogin(ip);
    return authenticationFailure();
  }

  const parsed = loginSchema.safeParse(body);

  if (!parsed.success || !isAdminAuthenticationConfigured() || !verifyAdminPassword(parsed.data.password)) {
    recordFailedAdminLogin(ip);
    return authenticationFailure();
  }

  try {
    const response = NextResponse.json({ authenticated: true }, { headers: noStoreHeaders });
    response.cookies.set(ADMIN_SESSION_COOKIE_NAME, await issueAdminSession(), getAdminSessionCookieOptions());
    clearFailedAdminLogins(ip);
    return response;
  } catch {
    return authenticationFailure();
  }
}
