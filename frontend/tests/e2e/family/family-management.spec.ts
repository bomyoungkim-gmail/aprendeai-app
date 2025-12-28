import { test, expect } from '@playwright/test';

test.describe('Family Management (E2E)', () => {
  test.beforeEach(async ({ page }) => {
    // Login as owner user
    await page.goto('/login');
    await page.fill('[data-testid="email"]', 'owner@family-test.com');
    await page.fill('[data-testid="password"]', 'Test123!@#');
    await page.click('[data-testid="login-btn"]');
    
    // Wait for dashboard
    await expect(page).toHaveURL('/dashboard');
  });

  test('complete family creation and management workflow', async ({ page }) => {
    // Navigate to families page
    await page.goto('/settings/families');
    await expect(page.locator('h1:has-text("Families")')).toBeVisible();

    // Create new family
    await page.click('[data-testid="create-family-btn"]');
    await page.fill('[data-testid="family-name-input"]', 'E2E Test Family');
    await page.click('[data-testid="submit-family-btn"]');
    
    // Verify creation success
    await expect(page.locator('text=E2E Test Family')).toBeVisible();
    await expect(page.locator('[data-testid="owner-badge"]')).toBeVisible();

    // Verify owner status
    const familyCard = page.locator('[data-testid="family-card"]:has-text("E2E Test Family")');
    await expect(familyCard.locator('text=OWNER')).toBeVisible();
  });

  test('invite member to family', async ({ page }) => {
    // Navigate to family dashboard
    await page.goto('/settings/families');
    await page.click('[data-testid="family-card"]:has-text("E2E Test Family")');
    
    // Open invite modal
    await page.click('[data-testid="invite-member-btn"]');
    await expect(page.locator('[data-testid="invite-modal"]')).toBeVisible();

    // Fill invitation form
    await page.fill('[data-testid="member-email"]', 'newmember@test.com');
    await page.fill('[data-testid="member-name"]', 'New Member');
    await page.selectOption('[data-testid="member-role"]', 'GUARDIAN');
    
    // Submit invitation
    await page.click('[data-testid="send-invite-btn"]');
    
    // Verify success message
    await expect(page.locator('text=Invitation sent successfully')).toBeVisible();
    
    // Verify alert about placeholder account
    await expect(page.locator('text=will receive an email')).toBeVisible();

    // Verify member appears in list
    await expect(page.locator('[data-testid="member-list"]')).toContainText('newmember@test.com');
    await expect(page.locator('[data-testid="member-list"]')).toContainText('GUARDIAN');
  });

  test('set family as primary', async ({ page }) => {
    // Navigate to family dashboard
    await page.goto('/settings/families');
    
    // Create second family first
    await page.click('[data-testid="create-family-btn"]');
    await page.fill('[data-testid="family-name-input"]', 'Second Family');
    await page.click('[data-testid="submit-family-btn"]');
    
    // Verify two families exist
    await expect(page.locator('[data-testid="family-card"]')).toHaveCount(2);

    // Click on second family
    await page.click('[data-testid="family-card"]:has-text("Second Family")');
    
    // Set as primary
    await page.click('[data-testid="set-primary-btn"]');
    
    // Verify success
    await expect(page.locator('text=Primary family updated')).toBeVisible();
    await expect(page.locator('[data-testid="primary-badge"]')).toBeVisible();

    // Go back to families list
    await page.goto('/settings/families');
    
    // Verify primary badge shows on correct family
    const secondFamilyCard = page.locator('[data-testid="family-card"]:has-text("Second Family")');
    await expect(secondFamilyCard.locator('[data-testid="primary-indicator"]')).toBeVisible();
  });

  test('transfer family ownership', async ({ page }) => {
    // First, create a member to transfer to
    await page.goto('/settings/families');
    await page.click('[data-testid="family-card"]:has-text("E2E Test Family")');
    
    // Ensure there's a member to transfer to
    const memberCount = await page.locator('[data-testid="member-row"]').count();
    if (memberCount < 2) {
      // Invite a member first
      await page.click('[data-testid="invite-member-btn"]');
      await page.fill('[data-testid="member-email"]', 'transfer-target@test.com');
      await page.selectOption('[data-testid="member-role"]', 'GUARDIAN');
      await page.click('[data-testid="send-invite-btn"]');
      await page.waitForTimeout(1000);
    }

    // Open transfer ownership modal
    await page.click('[data-testid="transfer-owner-btn"]');
    await expect(page.locator('[data-testid="transfer-modal"]')).toBeVisible();

    // Select new owner
    await page.selectOption('[data-testid="new-owner-select"]', { index: 1 });
    
    // Confirm transfer
    await page.fill('[data-testid="confirm-transfer-input"]', 'TRANSFER');
    await page.click('[data-testid="confirm-transfer-btn"]');

    // Verify success
    await expect(page.locator('text=Ownership transferred')).toBeVisible();
    
    // Verify role change
    await expect(page.locator('[data-testid="current-user-role"]')).toContainText('GUARDIAN');
    
    // Verify owner buttons are now hidden
    await expect(page.locator('[data-testid="transfer-owner-btn"]')).not.toBeVisible();
    await expect(page.locator('[data-testid="delete-family-btn"]')).not.toBeVisible();
  });

  test('delete family workflow', async ({ page }) => {
    // Create a family to delete
    await page.goto('/settings/families');
    await page.click('[data-testid="create-family-btn"]');
    await page.fill('[data-testid="family-name-input"]', 'Family To Delete');
    await page.click('[data-testid="submit-family-btn"]');
    
    // Navigate to the family
    await page.goto('/settings/families');
    await page.click('[data-testid="family-card"]:has-text("Family To Delete")');
    
    // Click delete button
    await page.click('[data-testid="delete-family-btn"]');
    
    // Confirm deletion
    await expect(page.locator('[data-testid="delete-modal"]')).toBeVisible();
    await page.fill('[data-testid="confirm-delete-input"]', 'DELETE');
    await page.click('[data-testid="confirm-delete-btn"]');

    // Verify redirect to families list
    await expect(page).toHaveURL('/settings/families');
    
    // Verify family is no longer in list
    await expect(page.locator('text=Family To Delete')).not.toBeVisible();
    
    // Verify success message
    await expect(page.locator('text=Family deleted successfully')).toBeVisible();
  });

  test('view family with primary badge', async ({ page }) => {
    await page.goto('/settings/families');
    
    // Set first family as primary if not already
    const firstFamily = page.locator('[data-testid="family-card"]').first();
    await firstFamily.click();
    
    const setPrimaryBtn = page.locator('[data-testid="set-primary-btn"]');
    if (await setPrimaryBtn.isVisible()) {
      await setPrimaryBtn.click();
      await page.waitForTimeout(500);
    }
    
    // Go back to list
    await page.goto('/settings/families');
    
    // Verify primary badge
    const primaryFamily = page.locator('[data-testid="family-card"]').first();
    await expect(primaryFamily.locator('[data-testid="primary-indicator"]')).toBeVisible();
    await expect(primaryFamily.locator('text=Primary')).toBeVisible();
  });

  test('member list shows correct roles and statuses', async ({ page }) => {
    await page.goto('/settings/families');
    await page.locator('[data-testid="family-card"]').first().click();
    
    // Verify member list is visible
    await expect(page.locator('[data-testid="member-list"]')).toBeVisible();
    
    // Verify owner is shown
    const ownerRow = page.locator('[data-testid="member-row"]:has-text("OWNER")');
    await expect(ownerRow).toBeVisible();
    
    // Verify status badge
    await expect(ownerRow.locator('[data-testid="status-badge"]:has-text("ACTIVE")')).toBeVisible();
    
    // Verify at least one member exists
    const memberCount = await page.locator('[data-testid="member-row"]').count();
    expect(memberCount).toBeGreaterThan(0);
  });

  test('non-owner cannot see owner-only buttons', async ({ page }) => {
    // This test requires logging in as a non-owner
    // For now, we'll logout and login as a different user
    
    await page.goto('/settings');
    await page.click('[data-testid="logout-btn"]');
    
    // Login as a guardian member
    await page.goto('/login');
    await page.fill('[data-testid="email"]', 'newmember@test.com');
    await page.fill('[data-testid="password"]', 'NewPassword123!');
    await page.click('[data-testid="login-btn"]');
    
    // Navigate to family
    await page.goto('/settings/families');
    await page.locator('[data-testid="family-card"]').first().click();
    
    // Verify owner-only buttons are hidden
    await expect(page.locator('[data-testid="invite-member-btn"]')).not.toBeVisible();
    await expect(page.locator('[data-testid="transfer-owner-btn"]')).not.toBeVisible();
    await expect(page.locator('[data-testid="delete-family-btn"]')).not.toBeVisible();
    
    // Verify member can see family details
    await expect(page.locator('[data-testid="family-name"]')).toBeVisible();
    await expect(page.locator('[data-testid="member-list"]')).toBeVisible();
  });
});
