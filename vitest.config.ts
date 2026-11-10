import { defineConfig } from "vitest/config";
import path from "node:path";

// Unit tests only: pure functions and server logic with Next/Supabase mocked.
// No jsdom, no component rendering — that belongs in the Playwright pass.
export default defineConfig({
  resolve: {
    alias: { "@": path.resolve(import.meta.dirname, ".") },
  },
  test: {
    environment: "node",
    include: ["**/*.test.ts"],
    exclude: ["node_modules/**", ".next/**"],
  },
});
