/**
 * @file app/page.tsx
 *
 * Next.js root page – the single entry point for the PhishLens UI.
 *
 * This file is intentionally minimal. All layout, state, and interaction logic
 * live in `TriageWorkspace`. The page component exists solely to satisfy the
 * Next.js App Router file convention and mount the workspace as the default export.
 *
 * @see components/triage-workspace.tsx for the full application shell
 */

import { TriageWorkspace } from "@/components/triage-workspace";
import { ADMIN_SESSION_COOKIE_NAME, hasValidAdminSession } from "@/lib/admin-session.server";
import { cookies } from "next/headers";

export default async function Home() {
  // Session verification happens on the server, so the client receives only a
  // boolean UI state and never a session token or administrator secret.
  const cookieStore = await cookies();
  const isAdminAuthenticated = await hasValidAdminSession(
    cookieStore.get(ADMIN_SESSION_COOKIE_NAME)?.value,
  );

  return <TriageWorkspace initialAdminAuthenticated={isAdminAuthenticated} />;
}
