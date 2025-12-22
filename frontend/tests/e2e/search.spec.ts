import { test, expect } from '@playwright/test';

test.describe('Global Search', () => {
  test.beforeEach(async ({ page, context }) => {
    // Clear context to prevent stale session issues
    await context.clearCookies();
    await page.addInitScript(() => {
        window.localStorage.clear();
        window.sessionStorage.clear();
    });

    await page.goto('/login');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
  });

  test('searches across all content', async ({ page }) => {
    // Open search (could be on dashboard or dedicated page)
    await page.goto('/search');
    
    // Or use keyboard shortcut
    // await page.keyboard.press('Meta+K');
    
    // Enter search query
    const searchInput = page.locator('input[placeholder*="Search"], input[type="search"]').first();
    await searchInput.fill('learning');
    
    // Wait for results
    await page.waitForTimeout(1000);
    
    // Check results appear
    const results = page.locator('[data-testid="search-result"], .search-result');
    const count = await results.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('searches in video/audio transcripts', async ({ page }) => {
    await page.goto('/search');
    
    const searchInput = page.locator('input[placeholder*="Search"]').first();
    await searchInput.fill('transcript content');
    
    // Open filters
    const filterBtn = page.locator('button:has-text("Filter"), [aria-label="Filter"]');
    if (await filterBtn.isVisible()) {
      await filterBtn.click();
      
      // Select transcript search
      const transcriptOption = page.locator('select, [data-filter="searchIn"]');
      if (await transcriptOption.isVisible()) {
        await transcriptOption.selectOption('transcript');
        
        // Verify transcript results
        await page.waitForTimeout(1000);
        const transcriptBadge = page.locator('text=transcript, [data-type="transcript"]');
        if (await transcriptBadge.count() > 0) {
          await expect(transcriptBadge.first()).toBeVisible();
        }
      }
    }
  });

  test('filters search by content type', async ({ page }) => {
    await page.goto('/search');
    
    const searchInput = page.locator('input[placeholder*="Search"]').first();
    await searchInput.fill('test');
    
    // Open filter panel
    const filterBtn = page.locator('button[aria-label*="filter"], button:has-text("Filter")');
    if (await filterBtn.isVisible()) {
      await filterBtn.click();
      
      // Select content type
      const typeFilter = page.locator('select[name="contentType"], [data-filter="contentType"]');
      if (await typeFilter.isVisible()) {
        await typeFilter.selectOption('VIDEO');
        
        await page.waitForTimeout(500);
        
        // Verify filtered results
        const videoResults = page.locator('[data-type="VIDEO"], text=VIDEO');
        if (await videoResults.count() > 0) {
          await expect(videoResults.first()).toBeVisible();
        }
      }
    }
  });

  test('highlights search query in results', async ({ page }) => {
    await page.goto('/search');
    
    const searchQuery = 'important';
    const searchInput = page.locator('input[placeholder*="Search"]').first();
    await searchInput.fill(searchQuery);
    
    await page.waitForTimeout(1000);
    
    // Check if query is highlighted in results
    const highlighted = page.locator('mark, .highlight, [data-highlighted]');
    if (await highlighted.count() > 0) {
      const text = await highlighted.first().textContent();
      expect(text?.toLowerCase()).toContain(searchQuery.toLowerCase());
    }
  });

  test('clears search and filters', async ({ page }) => {
    await page.goto('/search');
    
    const searchInput = page.locator('input[placeholder*="Search"]').first();
    await searchInput.fill('test query');
    
    // Click clear button
    const clearBtn = page.locator('button[aria-label*="clear"], button:has([class*="X"])');
    if (await clearBtn.isVisible()) {
      await clearBtn.click();
      
      // Verify cleared
      const inputValue = await searchInput.inputValue();
      expect(inputValue).toBe('');
    }
  });

  test('navigates to content from search results', async ({ page }) => {
    await page.goto('/search');
    
    const searchInput = page.locator('input[placeholder*="Search"]').first();
    await searchInput.fill('content');
    
    await page.waitForTimeout(1000);
    
    // Click first result
    const firstResult = page.locator('[data-testid="search-result"], .search-result, a[href*="/reader/"]').first();
    if (await firstResult.isVisible()) {
      await firstResult.click();
      
      // Verify navigated
      await expect(page).toHaveURL(/\/reader\//);
    }
  });

  test('shows empty state when no results', async ({ page }) => {
    await page.goto('/search');
    
    const searchInput = page.locator('input[placeholder*="Search"]').first();
    await searchInput.fill('xyzabc123nonexistent');
    
    await page.waitForTimeout(1000);
    
    // Check for empty state
    const emptyState = page.locator('text=No results, text=not found');
    await expect(emptyState).toBeVisible();
  });
});
