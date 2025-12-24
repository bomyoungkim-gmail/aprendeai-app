import { test, expect } from '@playwright/test';

test.describe('Family Owner Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // Login as family owner
    await page.goto('/login');
    await page.fill('[data-testid="email"]', 'owner@family-test.com');
    await page.fill('[data-testid="password"]', 'Test123!');
    await page.click('[data-testid="login-btn"]');
    await page.waitForURL('/parent/dashboard');
  });

  test('should display family overview on dashboard', async ({ page }) => {
    // Verify we're on the dashboard
    expect(page.url()).toContain('/parent/dashboard');

    // Check for key elements
    await expect(page.locator('h1')).toContainText(/welcome/i);
    await expect(page.locator('text=Total Members')).toBeVisible();
    await expect(page.locator('text=Active Learners')).toBeVisible();
  });

  test('should navigate to manage family page', async ({ page }) => {
    // Click on Manage Family link in sidebar
    await page.click('text=Manage Family');
    await page.waitForURL('/parent/manage-family');

    // Verify page loaded
    await expect(page.locator('h1')).toContainText('Manage Family');
    await expect(page.locator('button:has-text("Invite Member")')).toBeVisible();
  });

  test('should open invite modal', async ({ page }) => {
    await page.goto('/parent/manage-family');

    // Click invite button
    await page.click('button:has-text("Invite Member")');

    // Verify modal is open
    await expect(page.locator('text=Invite Family Member')).toBeVisible();
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('select')).toBeVisible();
  });

  test('should display member list', async ({ page }) => {
    await page.goto('/parent/manage-family');

    // Verify table is visible
    await expect(page.locator('table')).toBeVisible();
    await expect(page.locator('th:has-text("Member")')).toBeVisible();
    await expect(page.locator('th:has-text("Role")')).toBeVisible();
    await expect(page.locator('th:has-text("Status")')).toBeVisible();
  });

  test('should open transfer ownership modal', async ({ page }) => {
    await page.goto('/parent/manage-family');

    // Click transfer ownership button
    await page.click('button:has-text("Transfer Ownership")');

    // Verify modal is open
    await expect(page.locator('text=Transfer Ownership')).toBeVisible();
    await expect(page.locator('text=Select the new owner')).toBeVisible();
  });

  test('should navigate to settings page', async ({ page }) => {
    // Click on Settings link in sidebar
    await page.click('text=Settings');
    await page.waitForURL('/parent/settings');

    // Verify page loaded
    await expect(page.locator('h1')).toContainText('Settings');
  });

  test('should have back to learning link', async ({ page }) => {
    // Verify back link exists
    await expect(page.locator('a:has-text("Back to Learning")')).toBeVisible();

    // Click and verify redirect
    await page.click('a:has-text("Back to Learning")');
    await page.waitForURL('/dashboard');
    expect(page.url()).toContain('/dashboard');
  });
});
