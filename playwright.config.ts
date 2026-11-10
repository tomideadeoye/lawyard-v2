import { defineConfig, devices } from "@playwright/test";

// End-to-end smoke against the app running locally.
//
// These run against a real Supabase project (.env.local), so every spec here is
// read-only except the confirmation flow, which creates one throwaway user and
// deletes it in teardown. Never point this at a client's account.
//
//   pnpm test:e2e          headless
//   pnpm test:e2e:ui       inspector
export default defineConfig({
  testDir: "./e2e",
  timeout: 45_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "github" : [["list"]],
  use: {
    baseURL: process.env.E2E_BASE_URL ?? "http://localhost:3111",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    ...devices["Desktop Chrome"],
  },
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : {
        command: "npx next dev -p 3111",
        url: "http://localhost:3111",
        reuseExistingServer: true,
        timeout: 180_000,
      },
});
