import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "tests/e2e",
  timeout: 90_000, // SwiftShader on 2-core CI runners is slow
  retries: process.env.CI ? 1 : 0,
  webServer: { command: "npm run build && npm run preview -- --port 4173", url: "http://localhost:4173/synthwave-drive/", reuseExistingServer: true },
  use: {
    baseURL: "http://localhost:4173",
    colorScheme: "dark",
    launchOptions: { args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] },
  },
});
