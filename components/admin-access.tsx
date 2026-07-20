/**
 * @file components/admin-access.tsx
 *
 * A deliberately quiet, single-administrator control. It holds a password
 * only long enough to submit it to the same-origin login route, never stores
 * it in browser storage, and does not decide authorization for the AI route.
 */

"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

type AdminAccessProps = {
  isAdminAuthenticated: boolean;
  onSessionChange: (isAuthenticated: boolean) => void;
};

const GENERIC_AUTH_ERROR = "Unable to sign in. Please try again.";

/** Renders discreet administrator sign-in and sign-out controls in the footer. */
export function AdminAccess({ isAdminAuthenticated, onSessionChange }: AdminAccessProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        cache: "no-store",
        body: JSON.stringify({ password }),
      });

      if (!response.ok) {
        setError(GENERIC_AUTH_ERROR);
        return;
      }

      setPassword("");
      setIsOpen(false);
      onSessionChange(true);
      router.refresh();
    } catch {
      setError(GENERIC_AUTH_ERROR);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/admin/logout", {
        method: "POST",
        credentials: "same-origin",
        cache: "no-store",
      });

      if (!response.ok) {
        setError("Unable to sign out. Please try again.");
        return;
      }

      onSessionChange(false);
      router.refresh();
    } catch {
      setError("Unable to sign out. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isAdminAuthenticated) {
    return (
      <div className="shrink-0 text-right">
        <p className="text-xs font-medium text-[#9ec6de]">Admin session active</p>
        <button type="button" onClick={handleLogout} disabled={isLoading} className="mt-1 min-h-11 rounded-lg px-2 text-sm font-semibold text-[#b7cce0] underline-offset-4 hover:text-white hover:underline focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#66e3c4]/30 disabled:opacity-60">
          {isLoading ? "Signing out..." : "Sign out"}
        </button>
        {error && <p className="mt-2 max-w-52 text-xs leading-5 text-[#ffd080]" role="alert">{error}</p>}
      </div>
    );
  }

  return (
    <div className="shrink-0 sm:text-right">
      <button type="button" onClick={() => { setIsOpen((open) => !open); setError(null); }} aria-expanded={isOpen} aria-controls="admin-access-panel" className="min-h-11 rounded-lg px-2 text-sm font-semibold text-[#9ec6de] underline-offset-4 hover:text-white hover:underline focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#66e3c4]/30">
        Admin access
      </button>
      {isOpen && (
        <form id="admin-access-panel" onSubmit={handleLogin} className="mt-2 w-full max-w-sm rounded-xl border border-[#315272] bg-[#0d2137] p-4 text-left sm:ml-auto" aria-label="Administrator sign-in">
          <p className="font-semibold text-[#eff8ff]">Administrator sign-in</p>
          <p className="mt-1 text-xs leading-5 text-[#b7cce0]">For the project administrator only. Sign-in enables optional live Groq explanations for valid custom input.</p>
          <label htmlFor="admin-password" className="mt-3 block text-sm font-medium text-[#d8e7f2]">Admin password</label>
          <input id="admin-password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" maxLength={512} required disabled={isLoading} className="mt-1 min-h-11 w-full rounded-lg border border-[#41617d] bg-[#081522] px-3 text-white outline-none focus:border-[#66e3c4] focus:ring-4 focus:ring-[#66e3c4]/20 disabled:opacity-60" />
          <button type="submit" disabled={isLoading} className="mt-3 min-h-11 rounded-lg bg-[#315272] px-3 py-2 text-sm font-bold text-white hover:bg-[#416a91] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#66e3c4]/30 disabled:opacity-60">{isLoading ? "Signing in..." : "Sign in"}</button>
          {error && <p className="mt-3 text-sm leading-6 text-[#ffd080]" role="alert">{error}</p>}
        </form>
      )}
    </div>
  );
}
