import { test, expect } from '@playwright/test';

test.describe('Family Plan Features', () => {
  // Common setup: Login
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    
    // Using seeded test credentials with data-testid selectors
    await page.fill('[data-testid="email"]', 'facilitator@e2e-test.com');
    await page.fill('[data-testid="password"]', 'Test123!@#');
    await page.click('[data-testid="login-btn"]');
    await page.waitForURL('/dashboard');
  });

  test('can navigate to family settings page', async ({ page }) => {
    // Navigate via Settings
    await page.goto('/settings/account');
    
    // Click Family tab
    await page.click('a[href="/settings/family"]');
    
    await expect(page).toHaveURL('/settings/family');
    await expect(page.getByText('Family Management', { exact: false })).toBeVisible();
  });

  test('can create a new family', async ({ page }) => {
    await page.goto('/settings/family');

    // Click Create button (handling both empty state and header button)
    await page.click('[data-testid="create-family-btn"]');

    // Modal interaction
    await expect(page.getByText('Create New Family')).toBeVisible();
    
    const familyName = `Test Family ${Date.now()}`;
    await page.fill('input[placeholder*="The Smiths"]', familyName);
    
    // Submit
    await page.click('[data-testid="submit-family-btn"]');
    await page.waitForTimeout(500);

    // Verify modal closed and family appears in list
    await expect(page.getByText('Create New Family')).toBeHidden();
    await expect(page.getByText(familyName)).toBeVisible();
  });

  test('can navigate to family dashboard and view analytics', async ({ page }) => {
    await page.goto('/settings/family');

    // Ensure we have a family
    const dashboardLink = page.locator('a', { hasText: 'View Dashboard' }).first();
    
    if (await dashboardLink.count() === 0) {
      // Create one if missing
      await page.click('text=Create your first family');
      await page.fill('input[placeholder*="The Smiths"]', 'Dashboard Test Fam');
      await page.click('button:has-text("Create Family")');
      await page.waitForTimeout(1000); // Wait for refresh
    }

    // Click View Dashboard
    await page.getByText('View Dashboard').first().click();

    // Check dashboard URL
    await expect(page).toHaveURL(/\/settings\/family\/[a-zA-Z0-9-]+/);

    // Verify Dashboard Elements
    await expect(page.getByText('Free Plan')).toBeVisible();
    await expect(page.getByText('Content Uploads')).toBeVisible();
    await expect(page.getByText('Approx. Cost')).toBeVisible();
    
    // Verify Members list presence
    await expect(page.getByText('Family Members')).toBeVisible();
    await expect(page.getByText('(You)')).toBeVisible();
  });

  test('can open invite member modal', async ({ page }) => {
     await page.goto('/settings/family');
     
     // Go to dashboard of first family
     const dashboardLink = page.locator('a', { hasText: 'View Dashboard' }).first();
     if (await dashboardLink.count() === 0) {
        // Create if needed
        await page.click('text=Create your first family');
        await page.fill('input[placeholder*="The Smiths"]', 'Invite Test Fam');
        await page.click('button:has-text("Create Family")');
        await page.waitForTimeout(1000);
     }
     await page.getByText('View Dashboard').first().click();

     // Click Invite
     await page.getByRole('button', { name: 'Invite Member' }).click();

     // Verify Modal
     await expect(page.getByText('Invite Family Member')).toBeVisible();
     await expect(page.getByLabel('Email Address')).toBeVisible();
     await expect(page.getByLabel('Role')).toBeVisible();

     // Close modal
     await page.getByText('Cancel').click();
     await expect(page.getByText('Invite Family Member')).toBeHidden();
  });
  test('can set family as primary context', async ({ page }) => {
     await page.goto('/settings/family');
     
     // Ensure we have a family to set as primary
     const dashboardLink = page.locator('a', { hasText: 'View Dashboard' }).first();
     if (await dashboardLink.count() === 0) {
        await page.click('text=Create your first family');
        await page.fill('input[placeholder*="The Smiths"]', 'Primary Test Fam');
        await page.click('button:has-text("Create Family")');
        await page.waitForTimeout(1000);
     }
     await page.getByText('View Dashboard').first().click();

     // Check if already primary
     const isPrimary = await page.getByText('Primary', { exact: true }).count() > 0;
     
     if (!isPrimary) {
        // Click Set as Primary
        page.on('dialog', dialog => dialog.dismiss()); // Dismiss any alerts
        await page.getByRole('button', { name: 'Set as Primary' }).click();
        
        // Should now see Primary badge
        await expect(page.getByText('Primary', { exact: true })).toBeVisible();
     }
  });

  test('can invite member with auto-provisioning warning', async ({ page }) => {
     await page.goto('/settings/family');
     await page.getByText('View Dashboard').first().click();
     await page.getByRole('button', { name: 'Invite Member' }).click();

     // Check for the warning text about placeholder accounts
     await expect(page.getByText('Note: If the user does not have an account')).toBeVisible();

     // Invite a random email
     const randomEmail = `newuser${Date.now()}@example.com`;
     await page.fill('input[id="email"]', randomEmail);
     await page.click('button:has-text("Send Invite")');

     // Verify modal closes and member appears in list
     await expect(page.getByText('Invite Family Member')).toBeHidden();
     // Reload page to ensure list updates (or wait for query invalidation)
     await page.reload();
     await expect(page.getByText(randomEmail)).toBeVisible();
  });
});

