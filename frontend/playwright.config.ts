import { defineConfig } from "@playwright/test";

// Assumes backend on :8000 and frontend on :3000 are already running.
// Run: TAXLENS reset happens inside the test for a clean state.
export default defineConfig({
  testDir: "./e2e",
  timeout: 30_000,
  use: { baseURL: "http://localhost:3000", trace: "on-first-retry" },
});
