import { defineConfig, devices } from "@playwright/test";

const CI = Boolean(process.env.CI);

// E2E full-stack: navegador real contra uma stack ja no ar (React -> FastAPI ->
// PostgreSQL), sem mocks. "make e2e" sobe a stack isolada e define E2E_BASE_URL.
export default defineConfig({
  testDir: "./tests/e2e",
  // Um worker: os testes compartilham o banco e o Dashboard compara contagens.
  workers: 1,
  fullyParallel: false,
  forbidOnly: CI,
  retries: CI ? 1 : 0,
  timeout: 60_000,
  expect: { timeout: 10_000 },
  reporter: CI
    ? [["github"], ["list"], ["html", { open: "never" }]]
    : [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: process.env.E2E_BASE_URL ?? "http://localhost:5173",
    headless: true,
    actionTimeout: 10_000,
    navigationTimeout: 30_000,
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
