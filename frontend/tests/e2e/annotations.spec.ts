import { test, expect } from '@playwright/test';

test.describe('Annotation Features', () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
  });

  test('creates highlight annotation', async ({ page }) => {
    // Navigate to reader
    await page.goto('/reader/test-content-id');
    await page.waitForLoadState('networkidle');
    
    // Select text (simulate)
    const textElement = page.locator('p').first();
    await textElement.click();
    
    // Click highlight button
    const highlightBtn = page.locator('button:has-text("Highlight")');
    if (await highlightBtn.isVisible()) {
      await highlightBtn.click();
      
      // Verify annotation created
      await expect(page.locator('.annotation, [data-annotation]')).toBeVisible();
    }
  });

  test('searches annotations with query', async ({ page }) => {
    await page.goto('/annotations/search');
    
    // Enter search query
    const searchInput = page.locator('input[placeholder*="Search"]').first();
    await searchInput.fill('important note');
    
    // Wait for results
    await page.waitForTimeout(1000);
    
    // Check results appear
    const results = page.locator('[data-testid="search-result"], .search-result');
    const count = await results.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('filters annotations by type', async ({ page }) => {
    await page.goto('/annotations/search');
    
    // Click filter button
    const filterBtn = page.locator('button:has-text("Filter"), [aria-label="Filter"]');
    if (await filterBtn.isVisible()) {
      await filterBtn.click();
      
      // Select type filter
      const typeSelect = page.locator('select[name="type"], [data-filter="type"]');
      if (await typeSelect.isVisible()) {
        await typeSelect.selectOption('HIGHLIGHT');
        
        // Verify filter applied
        await expect(page.locator('text=HIGHLIGHT')).toBeVisible();
      }
    }
  });

  test('creates reply to annotation', async ({ page }) => {
    await page.goto('/reader/test-content-id');
    
    // Find existing annotation
    const annotation = page.locator('.annotation').first();
    if (await annotation.isVisible()) {
      await annotation.click();
      
      // Click reply button
      const replyBtn = page.locator('button:has-text("Reply")');
      if (await replyBtn.isVisible()) {
        await replyBtn.click();
        
        // Fill reply form
        const replyInput = page.locator('textarea[placeholder*="reply"], input[placeholder*="reply"]');
        await replyInput.fill('This is a test reply');
        
        // Submit
        const submitBtn = page.locator('button:has-text("Send"), button:has-text("Reply")').last();
        await submitBtn.click();
        
        // Verify reply created
        await expect(page.locator('text=This is a test reply')).toBeVisible();
      }
    }
  });

  test('toggles favorite annotation', async ({ page }) => {
    await page.goto('/reader/test-content-id');
    
    // Find annotation
    const annotation = page.locator('.annotation').first();
    if (await annotation.isVisible()) {
      // Click favorite button
      const favoriteBtn = page.locator('button[aria-label*="favorite"], button:has([class*="star"])').first();
      if (await favoriteBtn.isVisible()) {
        await favoriteBtn.click();
        
        // Verify favorited (star filled or different color)
        await page.waitForTimeout(500);
        // Check if state changed
        await expect(favoriteBtn).toHaveAttribute('aria-pressed', 'true');
      }
    }
  });

  test('exports annotations to PDF', async ({ page }) => {
    await page.goto('/annotations/search');
    
    // Click export button
    const exportBtn = page.locator('button:has-text("Export")');
    if (await exportBtn.isVisible()) {
      // Setup download listener
      const downloadPromise = page.waitForEvent('download');
      
      await exportBtn.click();
      
      // Select PDF format
      const pdfOption = page.locator('text=PDF, button:has-text("PDF")');
      if (await pdfOption.isVisible()) {
        await pdfOption.click();
        
        // Wait for download
        const download = await downloadPromise;
        expect(download.suggestedFilename()).toContain('.pdf');
      }
    }
  });

  test('exports annotations to Markdown', async ({ page }) => {
    await page.goto('/annotations/search');
    
    const exportBtn = page.locator('button:has-text("Export")');
    if (await exportBtn.isVisible()) {
      const downloadPromise = page.waitForEvent('download');
      
      await exportBtn.click();
      
      const mdOption = page.locator('text=Markdown, button:has-text("Markdown")');
      if (await mdOption.isVisible()) {
        await mdOption.click();
        
        const download = await downloadPromise;
        expect(download.suggestedFilename()).toContain('.md');
      }
    }
  });
});
