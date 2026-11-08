import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "e2e",
  timeout: 90_000,
  use: { baseURL: process.env.E2E_BASE_URL ?? "http://localhost:3000", permissions: ["microphone"], launchOptions: { executablePath: process.env.PW_CHROMIUM_PATH || undefined, args: ["--use-fake-ui-for-media-stream", "--use-fake-device-for-media-stream"] } },
  webServer: process.env.E2E_BASE_URL ? undefined : { command: "npm run start", port: 3000, reuseExistingServer: true, timeout: 120_000 }
});
