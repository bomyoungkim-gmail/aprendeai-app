import { test, expect } from '@playwright/test';

test.describe('Institution Admin Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // Login as institution admin
    await page.goto('/login');
    await page.fill('[data-testid="email"]', 'admin@institution-test.com');
    await page.fill('[data-testid="password"]', 'Test123!');
    await page.click('[data-testid="login-btn"]');
    await page.waitForURL('/institution/dashboard');
  });

  test('should display institution overview on dashboard', async ({ page }) => {
    // Verify we're on the dashboard
    expect(page.url()).toContain('/institution/dashboard');

    // Check for key elements
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('text=Active Members')).toBeVisible();
    await expect(page.locator('text=Pending Invites')).toBeVisible();
    await expect(page.locator('text=Pending Approvals')).toBeVisible();
    await expect(page.locator('text=Active Domains')).toBeVisible();
  });

  test('should navigate to members page', async ({ page }) => {
    // Click on Members & Invites link in sidebar
    await page.click('text=Members & Invites');
    await page.waitForURL('/institution/members');

    // Verify page loaded
    await expect(page.locator('h1')).toContainText(/members/i);
  });

  test('should navigate to pending approvals page', async ({ page }) => {
    // Click on Pending Approvals link in sidebar
    await page.click('text=Pending Approvals');
    await page.waitForURL('/institution/pending');

    // Verify page loaded
    await expect(page.locator('h1')).toContainText(/pending/i);
  });

  test('should navigate to domains page', async ({ page }) => {
    // Click on Domains link in sidebar
    await page.click('text=Domains');
    await page.waitForURL('/institution/domains');

    // Verify page loaded
    await expect(page.locator('h1')).toContainText(/domains/i);
  });

  test('should navigate to SSO configuration page', async ({ page }) => {
    // Click on SSO Configuration link in sidebar
    await page.click('text=SSO Configuration');
    await page.waitForURL('/institution/sso');

    // Verify page loaded
    await expect(page.locator('h1')).toContainText(/sso/i);
  });

  test('should have back to main dashboard link', async ({ page }) => {
    // Verify back link exists
    await expect(page.locator('a:has-text("Back to Main Dashboard")')).toBeVisible();

    // Click and verify redirect
    await page.click('a:has-text("Back to Main Dashboard")');
    await page.waitForURL('/dashboard');
    expect(page.url()).toContain('/dashboard');
  });

  test('should display quick action buttons', async ({ page }) => {
    await expect(page.locator('text=Manage Members')).toBeVisible();
    await expect(page.locator('text=Review Pending Approvals')).toBeVisible();
    await expect(page.locator('text=Manage Domains')).toBeVisible();
  });

  test('quick action buttons should navigate correctly', async ({ page }) => {
    // Click "Manage Members & Invites" quick action
    const manageMembersBtn = page.locator('button:has-text("Manage Members")');
    if (await manageMembersBtn.isVisible()) {
      await manageMembersBtn.click();
      await page.waitForURL('/institution/members');
      expect(page.url()).toContain('/institution/members');
    }
  });
});
