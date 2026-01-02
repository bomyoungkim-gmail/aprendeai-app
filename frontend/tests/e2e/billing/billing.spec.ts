import { test, expect } from '@playwright/test';


test.describe('Billing UI (E2E)', () => {
  test('should display Free Plan badge on dashboard', async ({ page }) => {
    // 1. Mock Entitlements API to force FREE plan
    await page.route('**/me/entitlements', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          source: 'FREE',
          planType: 'FREE',
          limits: {},
          features: {}
        }),
      });
    });

    // 2. Mock Auth (Short circuit login if possible, or standard login)
    // For simplicity, we assume standard login flow or session restoration
    await page.goto('/dashboard');
    // If redirected to login, perform login (simplified here assume dev environment or fast login)
    // In real scenario we use a helper. 
    // Just checking if element appears assuming auth state is handled or mocked.
  
    // 3. Verify Badge
    const badge = page.locator('text=Free Plan');
    await expect(badge).toBeVisible({ timeout: 10000 });
  });
});
