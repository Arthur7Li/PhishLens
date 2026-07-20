/**
 * @file components/theme-control.tsx
 *
 * Accessible appearance preference control. The mounted-state guard keeps the
 * server and initial client render identical while next-themes resolves the
 * saved visual preference.
 */

"use client";

import { Laptop, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useSyncExternalStore } from "react";

type ThemeOption = "light" | "dark" | "system";

const options: Array<{ value: ThemeOption; label: string; Icon: typeof Sun }> = [
  { value: "light", label: "Light", Icon: Sun },
  { value: "dark", label: "Dark", Icon: Moon },
  { value: "system", label: "System", Icon: Laptop },
];

/**
 * Gives hydration a stable "not mounted" snapshot, then exposes browser-only
 * theme preference after hydration without a synchronous effect state update.
 */
function useMounted() {
  return useSyncExternalStore(
    () => () => undefined,
    () => true,
    () => false,
  );
}

/** Provides three keyboard-operable choices and exposes the selected appearance. */
export function ThemeControl() {
  const { theme, setTheme } = useTheme();
  const mounted = useMounted();

  // Rendering System first prevents a hydration mismatch before the saved
  // non-sensitive appearance preference can be read in the browser.
  const selectedTheme: ThemeOption = mounted && (theme === "light" || theme === "dark" || theme === "system")
    ? theme
    : "system";

  return (
    <fieldset className="theme-control" aria-label="Appearance preference">
      <legend className="sr-only">Appearance preference</legend>
      <div className="theme-control-options" role="group" aria-label={`Appearance: ${selectedTheme}`}>
        {options.map(({ value, label, Icon }) => (
          <button
            key={value}
            type="button"
            aria-pressed={selectedTheme === value}
            aria-label={`Use ${label.toLowerCase()} appearance`}
            onClick={() => setTheme(value)}
            className="theme-control-option"
          >
            <Icon aria-hidden="true" size={15} strokeWidth={2} />
            <span className="theme-control-label">{label}</span>
          </button>
        ))}
      </div>
    </fieldset>
  );
}
