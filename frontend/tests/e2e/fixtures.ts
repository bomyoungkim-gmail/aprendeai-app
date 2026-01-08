import { test as base } from '@playwright/test';

/**
 * Custom Playwright Fixtures
 * 
 * Extends base test with automatic refresh token mocking
 * to prevent authentication failures during long-running or offline tests.
 */

export const test = base.extend({
  page: async ({ page }, use) => {
    // Mock refresh token endpoint for all tests
    await page.route('**/auth/refresh', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ 
          accessToken: 'mock-valid-token-for-e2e-tests',
          message: 'Token refreshed (mocked for E2E)'
        })
      });
    });

    // Use the page with mocked refresh
    await use(page);
  },
});

export { expect } from '@playwright/test';
