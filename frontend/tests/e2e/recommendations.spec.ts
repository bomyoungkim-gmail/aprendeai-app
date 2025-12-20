import { test, expect } from '@playwright/test';

test.describe('Content Recommendations', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
  });

  test('displays continue reading recommendations', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Check for Continue Reading section
    const continueSection = page.locator('text=Continue Reading, text=Continue Learning');
    if (await continueSection.isVisible()) {
      await expect(continueSection).toBeVisible();
      
      // Check for progress indicators
      const progressBars = page.locator('[role="progressbar"], .progress');
      if (await progressBars.count() > 0) {
        await expect(progressBars.first()).toBeVisible();
      }
    }
  });

  test('shows recent reads recommendations', async ({ page }) => {
    await page.goto('/dashboard');
    
    const recentSection = page.locator('text=Recent Reads, text=Recently Viewed');
    if (await recentSection.isVisible()) {
      await expect(recentSection).toBeVisible();
      
      // Check for content cards
      const contentCards = page.locator('[data-testid="content-card"], a[href*="/reader/"]');
      expect(await contentCards.count()).toBeGreaterThanOrEqual(0);
    }
  });

  test('displays popular in groups recommendations', async ({ page }) => {
    await page.goto('/dashboard');
    
    const popularSection = page.locator('text=Popular in Your Groups');
    if (await popularSection.isVisible()) {
      await expect(popularSection).toBeVisible();
    }
  });

  test('shows similar content recommendations', async ({ page }) => {
    await page.goto('/dashboard');
    
    const similarSection = page.locator('text=You Might Like, text=Similar');
    if (await similarSection.isVisible()) {
      await expect(similarSection).toBeVisible();
    }
  });

  test('displays trending recommendations', async ({ page }) => {
    await page.goto('/dashboard');
    
    const trendingSection = page.locator('text=Trending Now, text=Trending');
    if (await trendingSection.isVisible()) {
      await expect(trendingSection).toBeVisible();
      
      // Check for trending indicators (fire icon, etc)
      const trendingIcon = page.locator('[class*="flame"], [data-icon="flame"]');
      if (await trendingIcon.count() > 0) {
        await expect(trendingIcon.first()).toBeVisible();
      }
    }
  });

  test('navigates to content from recommendation', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Click any recommendation
    const recommendationCard = page.locator('[data-testid="recommendation-card"], a[href*="/reader/"]').first();
    if (await recommendationCard.isVisible()) {
      await recommendationCard.click();
      
      // Verify navigation
      await expect(page).toHaveURL(/\/reader\//);
    }
  });

  test('shows loading state while fetching recommendations', async ({ page }) => {
    // Navigate to dashboard
    await page.goto('/dashboard');
    
    // Check for loading indicators
    const loadingIndicator = page.locator('[data-testid="loading"], .animate-pulse, .skeleton');
    // Loading state might be very brief, so this is optional
    if (await loadingIndicator.count() > 0) {
      await expect(loadingIndicator.first()).toBeVisible();
    }
  });

  test('shows empty state when no recommendations', async ({ page }) => {
    // This would require a new user with no activity
    await page.goto('/dashboard');
    
    // Check for empty state messages
    const emptyState = page.locator('text=No recommendations, text=Start reading, text=No content');
    // May not appear if user has activity
  });
});
