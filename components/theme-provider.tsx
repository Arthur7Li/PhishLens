/**
 * @file components/theme-provider.tsx
 *
 * Client boundary for the visual theme only. `next-themes` persists a
 * non-sensitive appearance preference in browser storage; it is never used
 * for authentication, session state, or submitted email content.
 */

"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import type { ReactNode } from "react";

/** Applies light, dark, or system appearance classes before the app renders. */
export function ThemeProvider({ children }: { children: ReactNode }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      {children}
    </NextThemesProvider>
  );
}
