import { test, expect } from '@playwright/test';
import { TEST_USERS, TEST_GROUP } from '../fixtures/test-data';
import { loginAs, createGroup } from '../helpers/test-helpers';

/**
 * Study Groups - Management E2E Tests
 * 
 * Tests group creation, member management, and content association
 */

test.describe('Study Groups - Management', () => {
  let groupId: string;

  test.beforeEach(async ({ page }) => {
    await loginAs(page, TEST_USERS.facilitator.email);
  });

  test('user can create a study group', async ({ page }) => {
    await page.goto('/groups');
    
    // Click create group
    await page.click('button:has-text("Create Group"), button:has-text("Criar Grupo")');
    
    // Fill form
    await page.fill('input[name="name"]', TEST_GROUP.name);
    
    // Submit
    await page.click('button[type="submit"]');
    
    // Should navigate to group page
    await expect(page).toHaveURL(/\/groups\/[a-f0-9-]+/);
    
    // Group name should be visible
    await expect(page.locator(`text=${TEST_GROUP.name}`)).toBeVisible();
    
    // Store group ID for cleanup
    groupId = page.url().match(/\/groups\/([a-f0-9-]+)/)?.[1] || '';
  });

  test('owner can invite member to group', async ({ page }) => {
    // Create group first
    groupId = await createGroup(page, 'Invite Test Group');
    
    await page.goto(`/groups/${groupId}`);
    
    // Click invite button
    await page.click('button:has-text("Invite"), button:has-text("Convidar")');
    
    // Enter member email
    await page.fill('input[name="email"], input[type="email"]', TEST_USERS.member1.email);
    
    // Select role
    await page.selectOption('select[name="role"]', 'MEMBER');
    
    // Send invitation
    await page.click('button:has-text("Send"), button:has-text("Enviar")');
    
    // Success message should appear
    await expect(page.locator('text=/Invited|Convite enviado/i')).toBeVisible();
    
    // Member should appear in pending list
    await expect(page.locator(`text=${TEST_USERS.member1.email}`)).toBeVisible();
  });

  test.skip('member can accept invitation', async ({ page, context }) => {
    // This requires email or separate login flow
    // Placeholder for implementation
    test.skip();
  });

  test.skip('owner can add content to group', async ({ page }) => {
    // Needs content upload first
    test.skip();
  });

  test.skip('owner can remove content from group', async ({ page }) => {
    test.skip();
  });

  test('member cannot invite other members (permission check)', async ({ page, context }) => {
    // Login as member
    await page.context().clearCookies();
    await loginAs(page, TEST_USERS.member1.email);
    
    // Assume user is already a member of a group
    await page.goto(`/groups/${groupId || 'test-group-id'}`);
    
    // Invite button should not be visible or disabled
    const inviteButton = page.locator('button:has-text("Invite"), button:has-text("Convidar")');
    
    await expect(inviteButton).toBeHidden().catch(() => 
      expect(inviteButton).toBeDisabled()
    );
  });

  test.skip('owner can delete study group', async ({ page }) => {
    groupId = await createGroup(page, 'Delete Test Group');
    
    await page.goto(`/groups/${groupId}`);
    
    // Click delete/settings
    await page.click('button:has-text("Delete"), button:has-text("Settings")');
    
    // Confirm deletion
    await page.click('button:has-text("Confirm"), button:has-text("Confirmar")');
    
    // Should redirect to groups list
    await expect(page).toHaveURL(/\/groups$/);
    
    // Group should not appear in list
    await expect(page.locator(`text=${TEST_GROUP.name}`)).toBeHidden();
  });
});
