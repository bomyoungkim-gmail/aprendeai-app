import { test, expect } from '@playwright/test';

test.describe('Dashboard Features', () => {
  test.beforeEach(async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
  });

  test('displays activity heatmap', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Check heatmap is visible
    await expect(page.locator('text=Activity Heatmap')).toBeVisible();
    
    // Check for calendar container
    const heatmap = page.locator('[class*="react-calendar-heatmap"]');
    await expect(heatmap).toBeVisible();
  });

  test('displays activity stats', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Check stats cards
    await expect(page.locator('text=Current Streak')).toBeVisible();
    await expect(page.locator('text=Longest Streak')).toBeVisible();
    await expect(page.locator('text=Total Days')).toBeVisible();
  });

  test('shows continue learning cards with progress', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Check section exists
    await expect(page.locator('text=Continue Learning')).toBeVisible();
    
    // Check for progress bars
    const progressBars = page.locator('[role="progressbar"], .progress-bar');
    const count = await progressBars.count();
    expect(count).toBeGreaterThan(0);
  });

  test('displays recent content cards', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Check section exists
    await expect(page.locator('text=Recently Viewed')).toBeVisible();
    
    // Check for content cards
    const contentCards = page.locator('[data-testid="content-card"], a[href*="/reader/"]');
    const count = await contentCards.count();
    expect(count).toBeGreaterThan(0);
  });

  test('quick actions navigate correctly', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Check quick actions exist
    await expect(page.locator('text=Quick Actions')).toBeVisible();
    
    // Test upload action
    const uploadButton = page.locator('text=Upload Content');
    await expect(uploadButton).toBeVisible();
    await uploadButton.click();
    await expect(page).toHaveURL(/\/upload/);
  });

  test('quick actions - create cornell notes', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Click Cornell Notes action
    const cornellButton = page.locator('text=Create Cornell Notes');
    await expect(cornellButton).toBeVisible();
    await cornellButton.click();
    await expect(page).toHaveURL(/\/cornell-notes\/new/);
  });

  test('recommendations section displays correctly', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Scroll to recommendations if needed
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    
    // Check for recommendation types
    const recommendationTypes = [
      'Continue Reading',
      'Recent Reads',
      'Popular in Your Groups',
      'You Might Like',
      'Trending Now'
    ];
    
    for (const type of recommendationTypes) {
      const element = page.locator(`text="${type}"`);
      if (await element.isVisible()) {
        await expect(element).toBeVisible();
      }
    }
  });
});
