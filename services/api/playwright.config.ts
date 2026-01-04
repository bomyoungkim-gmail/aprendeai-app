import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright Configuration for E2E Tests
 * Configured for services/api/tests/e2e directory
 */
export default defineConfig({
  testDir: './tests/e2e',
  
  timeout: 30000,
  expect: {
    timeout: 5000,
  },
  
  // Sequential execution for WebSocket tests
  fullyParallel: false,
  
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  
  reporter: [
    ['html', { outputFolder: 'test-results/e2e-report' }],
    ['list'],
  ],
  
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    video: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  // Servers should be started manually or via CI
});
