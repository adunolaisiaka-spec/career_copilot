import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false, // sequential — tests share one dev server + test DB
  retries: 0,
  reporter: "list",
  // This project's dev server sits on a slow filesystem (Turbopack's own warning) —
  // each NEW route's first compile can take 30-90s, well past Playwright's defaults.
  timeout: 120_000,
  expect: { timeout: 20_000 },
  use: {
    baseURL: "http://localhost:3100",
    trace: "retain-on-failure",
    navigationTimeout: 90_000,
    actionTimeout: 20_000,
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: "node scripts/start-e2e-server.mjs",
    url: "http://localhost:3100",
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
