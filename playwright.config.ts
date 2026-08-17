import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e-tests",
  timeout: 45000,
  fullyParallel: true,
  retries: 0,
  reporter: "line",
  use: {
    baseURL: "http://127.0.0.1:5173",
    headless: false,
    launchOptions: { slowMo: 350 },
    ignoreHTTPSErrors: true,
    viewport: { width: 1920, height: 1080 },
    trace: "retain-on-failure",
  },
  webServer: {
    command: "npm run dev",
    url: "http://127.0.0.1:5173",
    reuseExistingServer: true,
    timeout: 60000,
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});