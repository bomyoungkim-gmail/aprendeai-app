import { test, expect } from '@playwright/test';

test.describe('Session History Page', () => {
  test.beforeEach(async ({ page }) => {
    // Mock authentication
    await page.goto('http://localhost:3000/history');
    // Assume user is logged in
  });

  test('should display session history page with tabs', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Session History');
    await expect(page.locator('button:has-text("Sessions")')).toBeVisible();
    await expect(page.locator('button:has-text("Analytics")')).toBeVisible();
  });

  test('should show sessions list by default', async ({ page }) => {
    // Wait for sessions to load
    await page.waitForSelector('[data-testid="session-card"]', { timeout: 5000 });
    
    const sessionCards = page.locator('[data-testid="session-card"]');
    const count = await sessionCards.count();
    
    expect(count).toBeGreaterThan(0);
  });

  test('should filter sessions by phase', async ({ page }) => {
    await page.selectOption('select[name="phase"]', 'PRE');
    
    // Wait for filtered results
    await page.waitForTimeout(500);
    
    const phaseLabels = page.locator('.phase');
    const count = await phaseLabels.count();
    
    for (let i = 0; i < count; i++) {
      await expect(phaseLabels.nth(i)).toContainText('PRE');
    }
  });

  test('should search sessions by content title', async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="Search"]');
    await searchInput.fill('test article');
    
    await page.waitForTimeout(500);
    
    const sessionTitles = page.locator('.session-title');
    const firstTitle = await sessionTitles.first().textContent();
    
    expect(firstTitle?.toLowerCase()).toContain('test');
  });

  test('should paginate sessions', async ({ page }) => {
    const nextButton = page.locator('button:has-text("Next")');
    
    if (await nextButton.isEnabled()) {
      await nextButton.click();
      await page.waitForTimeout(500);
      
      await expect(page.locator('text=/Page 2/')).toBeVisible();
    }
  });

  test('should switch to analytics tab', async ({ page }) => {
    await page.click('button:has-text("Analytics")');
    
    await expect(page.locator('text=/Activity Heatmap/')).toBeVisible();
    await expect(page.locator('text=/Phase Distribution/')).toBeVisible();
    await expect(page.locator('text=/Total Sessions/')).toBeVisible();
  });

  test('should export sessions as CSV', async ({ page }) => {
    await page.click('button:has-text("Analytics")');
    
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.click('button:has-text("Export CSV")'),
    ]);
    
    expect(download.suggestedFilename()).toMatch(/sessions_.*\.csv/);
  });

  test('should export sessions as JSON', async ({ page }) => {
    await page.click('button:has-text("Analytics")');
    
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.click('button:has-text("Export JSON")'),
    ]);
    
    expect(download.suggestedFilename()).toMatch(/sessions_.*\.json/);
  });

  test('should display activity heatmap', async ({ page }) => {
    await page.click('button:has-text("Analytics")');
    
    const heatmapCells = page.locator('.session-item, [class*="bg-blue"]');
    const count = await heatmapCells.count();
    
    // Should have some heatmap cells
    expect(count).toBeGreaterThan(0);
  });
});
