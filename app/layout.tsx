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
