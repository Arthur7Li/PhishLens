/**
 * @file components/phishlens-site.tsx
 *
 * Client-side presentation shell for the public product site. It keeps the
 * server-verified administrator boolean as a UI hint only; all route-level
 * authorization remains on the server.
 */

"use client";

import { useState } from "react";
import { ProductSections } from "@/components/product-sections";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { TriageWorkspace } from "@/components/triage-workspace";

type PhishLensSiteProps = {
  /** Server-derived state used only to tailor administrator-facing presentation. */
  initialAdminAuthenticated: boolean;
};

/** Composes the immediate analyzer with the static educational product-site content. */
export function PhishLensSite({ initialAdminAuthenticated }: PhishLensSiteProps) {
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(initialAdminAuthenticated);

  return (
    <div className="site-shell">
      <SiteHeader />
      <main id="main-content" className="site-main" tabIndex={-1}>
        <TriageWorkspace isAdminAuthenticated={isAdminAuthenticated} />
        <ProductSections />
      </main>
      <SiteFooter isAdminAuthenticated={isAdminAuthenticated} onSessionChange={setIsAdminAuthenticated} />
    </div>
  );
}
