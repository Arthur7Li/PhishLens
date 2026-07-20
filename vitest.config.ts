/**
 * Vitest configuration. Next.js enforces `server-only` at application build
 * time; tests replace that marker with an empty module so pure server helpers
 * can be unit-tested without pretending to be client components.
 */

import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./", import.meta.url)),
      "server-only": fileURLToPath(new URL("./test/server-only.ts", import.meta.url)),
    },
  },
});
