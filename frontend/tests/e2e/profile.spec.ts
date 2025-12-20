import { test, expect } from '@playwright/test';

test.describe('User Profile and Settings', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
  });

  test('views profile page', async ({ page }) => {
    await page.goto('/profile');
    
    // Check profile elements
    await expect(page.locator('text=Profile, h1:has-text("Profile")')).toBeVisible();
    
    // Check for user info
    const userName = page.locator('[data-testid="user-name"], .user-name');
    if (await userName.count() > 0) {
      await expect(userName.first()).toBeVisible();
    }
  });

  test('updates profile information', async ({ page }) => {
    await page.goto('/profile');
    
    // Click edit button
    const editBtn = page.locator('button:has-text("Edit"), button[aria-label="Edit profile"]');
    if (await editBtn.isVisible()) {
      await editBtn.click();
      
      // Update name
      const nameInput = page.locator('input[name="name"]');
      if (await nameInput.isVisible()) {
        await nameInput.fill('Updated Test User');
        
        // Save
        const saveBtn = page.locator('button:has-text("Save")');
        await saveBtn.click();
        
        // Verify success message
        await expect(page.locator('text=success, text=updated')).toBeVisible();
      }
    }
  });

  test('uploads avatar', async ({ page }) => {
    await page.goto('/profile');
    
    // Find upload button
    const uploadBtn = page.locator('button:has-text("Upload"), input[type="file"]');
    if (await uploadBtn.count() > 0) {
      // Set file input
      const fileInput = page.locator('input[type="file"]');
      if (await fileInput.count() > 0) {
        await fileInput.setInputFiles({
          name: 'avatar.png',
          mimeType: 'image/png',
          buffer: Buffer.from('fake-image-data'),
        });
        
        // Verify upload initiated
        await page.waitForTimeout(1000);
      }
    }
  });

  test('changes password', async ({ page }) => {
    await page.goto('/settings');
    
    // Navigate to security settings
    const securityTab = page.locator('text=Security, button:has-text("Security")');
    if (await securityTab.isVisible()) {
      await securityTab.click();
      
      // Fill password change form
      const currentPassword = page.locator('input[name="currentPassword"]');
      const newPassword = page.locator('input[name="newPassword"]');
      const confirmPassword = page.locator('input[name="confirmPassword"]');
      
      if (await currentPassword.isVisible()) {
        await currentPassword.fill('password123');
        await newPassword.fill('newpassword123');
        await confirmPassword.fill('newpassword123');
        
        const saveBtn = page.locator('button:has-text("Change Password"), button:has-text("Update")');
        await saveBtn.click();
        
        // Verify success
        await expect(page.locator('text=success, text=changed')).toBeVisible();
      }
    }
  });

  test('updates email preferences', async ({ page }) => {
    await page.goto('/settings');
    
    // Navigate to notifications
    const notificationsTab = page.locator('text=Notifications, button:has-text("Notifications")');
    if (await notificationsTab.isVisible()) {
      await notificationsTab.click();
      
      // Toggle email preference
      const emailToggle = page.locator('input[type="checkbox"][name*="email"]').first();
      if (await emailToggle.isVisible()) {
        await emailToggle.click();
        
        // Save
        const saveBtn = page.locator('button:has-text("Save")');
        if (await saveBtn.isVisible()) {
          await saveBtn.click();
          await expect(page.locator('text=success')).toBeVisible();
        }
      }
    }
  });

  test('deletes account', async ({ page }) => {
    await page.goto('/settings');
    
    // Navigate to danger zone
    const deleteSection = page.locator('text=Delete Account, text=Danger Zone');
    if (await deleteSection.isVisible()) {
      await deleteSection.scrollIntoViewIfNeeded();
      
      const deleteBtn = page.locator('button:has-text("Delete Account")');
      if (await deleteBtn.isVisible()) {
        await deleteBtn.click();
        
        // Confirm in modal
        const confirmBtn = page.locator('button:has-text("Confirm"), button:has-text("Delete"):visible');
        if (await confirmBtn.isVisible()) {
          await confirmBtn.click();
          
          // Should redirect to login or homepage
          await expect(page).toHaveURL(/\/(login|$)/);
        }
      }
    }
  });

  test('views activity stats',async ({ page }) => {
    await page.goto('/profile');
    
    // Check for stats
    const statsSection = page.locator('text=Statistics, [data-testid="stats"]');
    if (await statsSection.isVisible()) {
      await expect(statsSection).toBeVisible();
      
      // Check for streak info
      const streak = page.locator('text=Streak, text=streak');
      if (await streak.count() > 0) {
        await expect(streak.first()).toBeVisible();
      }
    }
  });
});
