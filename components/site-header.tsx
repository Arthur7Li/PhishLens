/**
 * @file components/site-header.tsx
 *
 * Sticky, anchor-based site navigation. The compact mobile navigation uses
 * native `details` and `summary` controls so it remains predictable for both
 * keyboard and assistive-technology users without a custom menu state.
 */

"use client";

import { ExternalLink, Menu } from "lucide-react";
import { useState } from "react";
import { ThemeControl } from "@/components/theme-control";

const navigationItems = [
  { href: "#analyze", label: "Analyze" },
  { href: "#how-it-works", label: "How it works" },
  { href: "#safety", label: "Safety" },
  { href: "#about", label: "About" },
] as const;

/** Shared anchor list used by both desktop and native mobile navigation. */
function NavigationLinks({ className, onNavigate }: { className?: string; onNavigate?: () => void }) {
  return (
    <nav className={className} aria-label="Primary navigation">
      {navigationItems.map((item) => (
        <a key={item.href} href={item.href} className="site-nav-link" onClick={onNavigate}>
          {item.label}
        </a>
      ))}
      <a
        href="https://github.com/Arthur7Li/PhishLens"
        target="_blank"
        rel="noreferrer"
        className="site-nav-link site-nav-link-external"
        onClick={onNavigate}
      >
        GitHub
        <ExternalLink aria-hidden="true" size={14} strokeWidth={1.8} />
      </a>
    </nav>
  );
}

/** Renders the persistent product header and a skip link for keyboard readers. */
export function SiteHeader() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <>
      <a className="skip-link" href="#main-content">
        Skip to main content
      </a>
      <header className="site-header">
        <div className="site-header-inner">
          <a href="#analyze" className="brand-link" aria-label="PhishLens home and analyzer">
            <span className="brand-mark" aria-hidden="true">P</span>
            <span className="brand-name">PhishLens</span>
            <span className="brand-context">Educational email triage</span>
          </a>

          <div className="site-header-desktop">
            <NavigationLinks className="site-nav-links" />
            <ThemeControl />
          </div>

          <details
            className="site-mobile-menu"
            open={isMobileMenuOpen}
            onToggle={(event) => setIsMobileMenuOpen(event.currentTarget.open)}
          >
            <summary aria-label={isMobileMenuOpen ? "Close site navigation" : "Open site navigation"}>
              <Menu aria-hidden="true" size={20} strokeWidth={1.8} />
              <span>Menu</span>
            </summary>
            <div className="site-mobile-menu-panel">
              <NavigationLinks className="site-mobile-nav-links" onNavigate={() => setIsMobileMenuOpen(false)} />
              <div className="site-mobile-theme">
                <p>Appearance</p>
                <ThemeControl />
              </div>
            </div>
          </details>
        </div>
      </header>
    </>
  );
}
