/**
 * @file app/layout.tsx
 *
 * Next.js root layout for PhishLens.
 *
 * Sets the HTML document-level metadata (title and description) and wraps all
 * page content in the standard `<html lang="en"> / <body>` shell.
 *
 * - Imports `globals.css` so Tailwind and the custom CSS variables are applied
 *   globally across the entire app.
 * - Uses the Next.js `Metadata` export convention so the title and meta
 *   description are injected server-side into the `<head>` without a separate
 *   `<Head>` component.
 *
 * PhishLens is a single-page application; this is the only layout file and
 * no nested layouts are used in Phase A.
 */

import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PhishLens | Safer email triage",
  description: "An educational, evidence-first phishing triage workspace.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
