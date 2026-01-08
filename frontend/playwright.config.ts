import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false, // Sequential for WebSocket tests
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : 1,
  reporter: 'html',
  
  // Global setup for authentication
  globalSetup: require.resolve('./tests/e2e/global-setup'),
  
  use: {
    baseURL: 'http://127.0.0.1:3000', // Use IP instead of localhost for cookie consistency
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    // Load authenticated state for all tests
    storageState: 'playwright/.auth/user.json',
  },
  timeout: 60000,

  projects: [
    {
      name: 'setup',
      testMatch: /global\.setup\.ts/,
    },
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
      dependencies: ['setup'],
    },
  ],

  // Start servers manually for now
  // webServer: {
  //   command: 'npm run dev',
  //   url: 'http://127.0.0.1:3000',
  //   reuseExistingServer: !process.env.CI,
  //   timeout: 120 * 1000,
  // },
});
