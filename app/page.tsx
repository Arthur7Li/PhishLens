/**
 * @file app/page.tsx
 *
 * Next.js root page – the single entry point for the PhishLens UI.
 *
 * This file stays deliberately small. The server verifies the administrator
 * session before passing a boolean presentation hint to the product-site shell;
 * route-level authorization remains enforced independently by the AI route.
 *
 * @see components/phishlens-site.tsx for the composed product-site shell
 */

import { PhishLensSite } from "@/components/phishlens-site";
import { ADMIN_SESSION_COOKIE_NAME, hasValidAdminSession } from "@/lib/admin-session.server";
import { cookies } from "next/headers";

export default async function Home() {
  // Session verification happens on the server, so the client receives only a
  // boolean UI state and never a session token or administrator secret.
  const cookieStore = await cookies();
  const isAdminAuthenticated = await hasValidAdminSession(
    cookieStore.get(ADMIN_SESSION_COOKIE_NAME)?.value,
  );

  return <PhishLensSite initialAdminAuthenticated={isAdminAuthenticated} />;
}
