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

export default function Home() {
  return <TriageWorkspace />;
}
