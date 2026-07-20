/**
 * @file app/api/admin/logout/route.ts
 *
 * Same-origin logout endpoint for the stateless single-admin session. Clearing
 * the browser cookie ends access in that browser without persisting a record.
 */

import { NextResponse } from "next/server";
import {
  ADMIN_SESSION_COOKIE_NAME,
  getClearedAdminSessionCookieOptions,
} from "@/lib/admin-session.server";
import { isSameOriginPost } from "@/lib/request-origin.server";

const noStoreHeaders = { "Cache-Control": "no-store, max-age=0", Pragma: "no-cache" };

/** Clears the session cookie only for a same-origin POST request. */
export async function POST(request: Request): Promise<NextResponse> {
  if (!isSameOriginPost(request)) {
    return NextResponse.json({ error: "Request could not be completed." }, { status: 403, headers: noStoreHeaders });
  }

  const response = NextResponse.json({ authenticated: false }, { headers: noStoreHeaders });
  response.cookies.set(ADMIN_SESSION_COOKIE_NAME, "", getClearedAdminSessionCookieOptions());
  return response;
}
