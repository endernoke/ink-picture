import { PlaywrightTestConfig } from "@playwright/test";

const config: PlaywrightTestConfig = {
  testDir: ".",
  timeout: 10000,
  // We only need one browser because we're testing terminal using web-based xterm.js, not cross-browser compatibility
  projects: [
    {
      name: "Chromium",
      use: {
        browserName: "chromium",
      },
    },
  ],
  reporter: "list",
  webServer: {
    command: "node server/server.ts",
    port: 3000,
    timeout: 120000,
    reuseExistingServer: !process.env.CI,
  },
  use: {
    baseURL: "http://localhost:3000",
  },
};
export default config;
