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
      <div className="admin-access admin-access-active">
        <p>Admin session active</p>
        <button type="button" onClick={handleLogout} disabled={isLoading} className="admin-link-button">
          {isLoading ? "Signing out..." : "Sign out"}
        </button>
        {error && <p className="admin-access-error" role="alert">{error}</p>}
      </div>
    );
  }

  return (
    <div className="admin-access">
      <button
        type="button"
        onClick={() => { setIsOpen((open) => !open); setError(null); }}
        aria-expanded={isOpen}
        aria-controls="admin-access-panel"
        className="admin-link-button"
      >
        Admin access
      </button>
      {isOpen && (
        <form id="admin-access-panel" onSubmit={handleLogin} className="admin-login-panel" aria-label="Administrator sign-in">
          <p>Administrator sign-in</p>
          <p>For the project administrator only. Sign-in enables optional live Groq explanations for valid custom input.</p>
          <label htmlFor="admin-password">Admin password</label>
          <input id="admin-password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" maxLength={512} required disabled={isLoading} className="admin-password-input" />
          <button type="submit" disabled={isLoading} className="button-secondary admin-submit">{isLoading ? "Signing in..." : "Sign in"}</button>
          {error && <p className="admin-access-error" role="alert">{error}</p>}
        </form>
      )}
    </div>
  );
}
