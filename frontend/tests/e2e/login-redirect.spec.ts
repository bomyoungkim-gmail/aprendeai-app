import { test, expect } from '@playwright/test';

test.describe('Login Redirect based on Role', () => {
  test.beforeEach(async ({ page }) => {
    // Clear any existing auth
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
  });

  test('should redirect INSTITUTION_ADMIN to /institution/dashboard', async ({ page }) => {
    // Navigate to login
    await page.goto('/login');

    // Fill login form (assumes test user exists with INSTITUTION_ADMIN role)
    await page.fill('[data-testid="email"]', 'admin@institution-test.com');
    await page.fill('[data-testid="password"]', 'Test123!');
    await page.click('[data-testid="login-btn"]');

    // Wait for redirect
    await page.waitForURL('/institution/dashboard', { timeout: 10000 });

    // Verify we're on the institution dashboard
    expect(page.url()).toContain('/institution/dashboard');
    await expect(page.locator('h1')).toContainText(/institution/i);
  });

  test('should redirect FAMILY_OWNER to /parent/dashboard', async ({ page }) => {
    // Navigate to login
    await page.goto('/login');

    // Fill login form (assumes test user exists with FAMILY_OWNER role)
    await page.fill('[data-testid="email"]', 'owner@family-test.com');
    await page.fill('[data-testid="password"]', 'Test123!');
    await page.click('[data-testid="login-btn"]');

    // Wait for redirect
    await page.waitForURL('/parent/dashboard', { timeout: 10000 });

    // Verify we're on the family dashboard
    expect(page.url()).toContain('/parent/dashboard');
    await expect(page.locator('h1')).toContainText(/welcome/i);
  });

  test('should redirect ADMIN to /admin', async ({ page }) => {
    // Navigate to login
    await page.goto('/login');

    // Fill login form (assumes test user exists with ADMIN role)
    await page.fill('[data-testid="email"]', 'platform-admin@test.com');
    await page.fill('[data-testid="password"]', 'Test123!');
    await page.click('[data-testid="login-btn"]');

    // Wait for redirect
    await page.waitForURL('/admin', { timeout: 10000 });

    // Verify we're on the admin dashboard
    expect(page.url()).toContain('/admin');
  });

  test('should redirect regular users to /dashboard', async ({ page }) => {
    // Navigate to login
    await page.goto('/login');

    // Fill login form (regular user)
    await page.fill('[data-testid="email"]', 'regular@test.com');
    await page.fill('[data-testid="password"]', 'Test123!');
    await page.click('[data-testid="login-btn"]');

    // Wait for redirect
    await page.waitForURL('/dashboard', { timeout: 10000 });

    // Verify we're on the regular dashboard
    expect(page.url()).toBe('/dashboard');
  });
});
