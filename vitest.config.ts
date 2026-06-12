import { defineConfig } from "vitest/config";

// Standalone config (not merged with vite.config.ts) so tests don't pull in
// the Tailwind plugin or the admin dev-server middleware. Pure-logic tests
// only — no jsdom; the few localStorage touch points are stubbed per test.
export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.{ts,tsx}"],
    // Fixed DST-observing timezone so the local-date logic in daily.ts is
    // exercised against real DST boundaries, identically on every machine/CI.
    env: { TZ: "America/New_York" },
  },
});
