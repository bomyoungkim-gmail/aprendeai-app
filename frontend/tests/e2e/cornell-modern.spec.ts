import { test, expect } from '@playwright/test';

test.describe('Modern Cornell Notes - E2E', () => {
  test.beforeEach(async ({ page }) => {
    // Login and navigate to test content
    await page.goto('/login');
    await page.fill('[name="email"]', 'test@example.com');
    await page.fill('[name="password"]', 'password');
    await page.click('button[type="submit"]');
    
    // Wait for redirect to dashboard
    await expect(page).toHaveURL('/dashboard');
  });

  test('should display modern Cornell layout with 70/30 split on desktop', async ({ page }) => {
    // Navigate to test content
    await page.goto('/reader/test-content-id');
    
    // Check layout structure
    await expect(page.locator('[data-testid="modern-cornell-layout"]')).toBeVisible();
    
    // Verify sidebar is visible on desktop
    await expect(page.locator('aside')).toBeVisible();
    
    // Verify tabs exist
    await expect(page.locator('button:has-text("Anotações")')).toBeVisible();
    await expect(page.locator('button:has-text("Tópicos")')).toBeVisible();
  });

  test('should collapse sidebar on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    await page.goto('/reader/test-content-id');
    
    // Sidebar should be hidden by default on mobile
    const sidebar = page.locator('aside');
    await expect(sidebar).toHaveClass(/translate-x-full/);
    
    // Click menu button to open
    await page.click('button[aria-label="Toggle sidebar"]');
    
    // Sidebar should be visible
    await expect(sidebar).not.toHaveClass(/translate-x-full/);
  });

  test('should switch between Annotations and Cues tabs', async ({ page }) => {
    await page.goto('/reader/test-content-id');
    
    // Click Cues tab
    await page.click('button:has-text("Tópicos")');
    
    // Verify tab is active (has blue border)
    await expect(page.locator('button:has-text("Tópicos")')).toHaveClass(/border-blue-600/);
    
    // Switch back to Annotations
    await page.click('button:has-text("Anotações")');
    await expect(page.locator('button:has-text("Anotações")')).toHaveClass(/border-blue-600/);
  });

  test('should display stream cards with correct icons', async ({ page }) => {
    await page.goto('/reader/test-content-id');
    
    // Wait for content to load
    await page.waitForSelector('[data-testid="stream-card"]');
    
    // Verify annotation card has highlighter icon
    const annotationCard = page.locator('[data-testid="stream-card-annotation"]').first();
    await expect(annotationCard.locator('svg')).toBeVisible();
    
    // Verify card has edit and delete buttons (visible on hover)
    await annotationCard.hover();
    await expect(annotationCard.locator('button[title="Edit color"]')).toBeVisible();
    await expect(annotationCard.locator('button[title="Delete"]')).toBeVisible();
  });

  test('should show AI toolbar button', async ({ page }) => {
    await page.goto('/reader/test-content-id');
    
    // Wait for PDF to load
    await page.waitForSelector('.react-pdf__Page');
    
    // Verify AI button exists in toolbar
    await expect(page.locator('button[title="IA Assistente"]')).toBeVisible();
  });

  test('should open AI assist menu when clicking AI button', async ({ page }) => {
    await page.goto('/reader/test-content-id');
    
    // Click AI button
    await page.click('button[title="IA Assistente"]');
    
    // Verify menu appears
    await expect(page.locator('text="Como posso ajudar?"')).toBeVisible();
    
    // Verify action buttons exist
    await expect(page.locator('button:has-text("Resumir Página")')).toBeVisible();
    await expect(page.locator('button:has-text("Gerar Tópicos")')).toBeVisible();
  });

  test('should navigate pages using toolbar', async ({ page }) => {
    await page.goto('/reader/test-content-id');
    
    await page.waitForSelector('.react-pdf__Page');
    
    // Click next page
    await page.click('button[title="Próxima página"]');
    
    // Verify page changed (check page input value)
    const pageInput = page.locator('input[type="text"]').first();
    await expect(pageInput).toHaveValue('2');
    
    // Click previous page
    await page.click('button[title="Página anterior"]');
    await expect(pageInput).toHaveValue('1');
  });

  test('should zoom in and out', async ({ page }) => {
    await page.goto('/reader/test-content-id');
    
    await page.waitForSelector('.react-pdf__Page');
    
    // Get initial zoom level
    const initialZoom = await page.locator('text=/\\d+%/').textContent();
    
    // Click zoom in
    await page.click('button[title="Aumentar zoom"]');
    
    // Verify zoom increased
    const newZoom = await page.locator('text=/\\d+%/').textContent();
    expect(parseInt(newZoom!)).toBeGreaterThan(parseInt(initialZoom!));
  });

  test('should delete stream item', async ({ page }) => {
    await page.goto('/reader/test-content-id');
    
    // Hover over first stream card
    const firstCard = page.locator('[data-testid="stream-card"]').first();
    await firstCard.hover();
    
    // Click delete button
    await firstCard.locator('button[title="Delete"]').click();
    
    // Verify toast appears
    await expect(page.locator('text="excluída"')).toBeVisible();
  });

  test('should support dark mode', async ({ page }) => {
    // Enable dark mode
    await page.emulateMedia({ colorScheme: 'dark' });
    
    await page.goto('/reader/test-content-id');
    
    // Verify dark mode classes are applied
    await expect(page.locator('body')).toHaveClass(/dark/);
    
    // Verify sidebar has dark background
    await expect(page.locator('aside')).toHaveClass(/dark:bg-gray-800/);
  });
});
