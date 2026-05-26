// @ts-check
import { defineConfig, devices } from '@playwright/test';

/**
 * BloodConnect E2E Test Configuration
 * Runs against the locally running Vite dev server (port 5173)
 *
 * Before running: start the frontend with `npm run dev` in /frontend
 * Then run:       npx playwright test
 */
export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  retries: 0,
  reporter: [['list'], ['html', { open: 'never' }]],

  use: {
    baseURL: 'http://localhost:5173',
    headless: true,
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
