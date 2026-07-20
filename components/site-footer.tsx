/**
 * @file components/site-footer.tsx
 *
 * Product footer with factual project links and the existing, discreet
 * single-administrator control. The footer does not decide authorization;
 * it only receives the server-derived UI state from the page shell.
 */

"use client";

import { ExternalLink } from "lucide-react";
import { AdminAccess } from "@/components/admin-access";

type SiteFooterProps = {
  isAdminAuthenticated: boolean;
  onSessionChange: (isAuthenticated: boolean) => void;
};

/** Renders source links, factual product limits, and the quiet admin entry point. */
export function SiteFooter({ isAdminAuthenticated, onSessionChange }: SiteFooterProps) {
  return (
    <footer className="site-footer">
      <div className="site-footer-inner">
        <div className="footer-summary">
          <a className="brand-link" href="#analyze" aria-label="Return to the PhishLens analyzer">
            <span className="brand-mark" aria-hidden="true">P</span>
            <span className="brand-name">PhishLens</span>
          </a>
          <p>Built as a security-sensitive educational prototype. Local deterministic analysis stays in the browser. The optional AI explanation sends submitted content to Groq only after you choose it. PhishLens does not fetch URLs, execute attachments, connect to inboxes, or retain submitted content.</p>
        </div>
        <div className="footer-links" aria-label="Project links">
          <a href="https://github.com/Arthur7Li/PhishLens" target="_blank" rel="noreferrer">Repository <ExternalLink aria-hidden="true" size={14} strokeWidth={1.8} /></a>
          <a href="https://github.com/Arthur7Li/PhishLens/issues" target="_blank" rel="noreferrer">Issues <ExternalLink aria-hidden="true" size={14} strokeWidth={1.8} /></a>
          <a href="#safety">Safety boundaries</a>
        </div>
        <div className="footer-admin">
          <AdminAccess isAdminAuthenticated={isAdminAuthenticated} onSessionChange={onSessionChange} />
        </div>
      </div>
    </footer>
  );
}
