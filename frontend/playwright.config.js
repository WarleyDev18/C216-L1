import { defineConfig, devices } from "@playwright/test";

// E2E full-stack: roda contra uma stack ja no ar (React -> FastAPI -> PostgreSQL).
// "make e2e" sobe a stack isolada e define E2E_BASE_URL; o padrao e a stack de desenvolvimento.
export default defineConfig({
  testDir: "./tests/e2e",
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: process.env.E2E_BASE_URL ?? "http://localhost:5173",
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
