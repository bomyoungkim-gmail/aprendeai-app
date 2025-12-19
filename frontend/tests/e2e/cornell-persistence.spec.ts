/**
 * E2E Test - Cornell Notes Persistence
 * 
 * Tests complete Cornell workflow:
 * - User creates notes
 * - Auto-save occurs
 * - Reload page
 * - Notes persist
 */

import { test, expect } from '@playwright/test';

test.describe('Cornell Notes Persistence', () => {
  test.beforeEach(async ({ page }) => {
    // Login (mock or real auth)
    await page.goto('/login');
    await page.fill('[name="email"]', 'test@example.com');
    await page.fill('[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    // Wait for redirect
    await page.waitForURL('/dashboard');
    
    // Navigate to a content item
    await page.click('[data-testid="content-item"]:first-child');
    await page.waitForURL(/\/contents\/.+/);
  });
  
  test('should autosave cue column and persist on reload', async ({ page }) => {
    // Switch to editing mode
    await page.click('[data-testid="toggle-mode-button"]');
    await expect(page.locator('[data-testid="editing-mode"]')).toBeVisible();
    
    // Type in cue column
    const cueInput = page.locator('[data-testid="cue-column-input"]');
    await cueInput.fill('What is the main concept?\nWhy is this important?\nHow does it relate?');
    
    // Wait for autosave (2 seconds)
    await page.waitForTimeout(3000);
    
    // Verify save indicator appeared
    await expect(page.locator('[data-testid="save-indicator"]')).toHaveText(/saved/i);
    
    // Reload page
    await page.reload();
    
    // Wait for load
    await page.waitForLoadState('networkidle');
    
    // Verify cue column persisted
    const cueText = await cueInput.inputValue();
    expect(cueText).toContain('What is the main concept?');
    expect(cueText).toContain('Why is this important?');
  });
  
  test('should persist summary across sessions', async ({ page }) => {
    // Switch to editing mode
    await page.click('[data-testid="toggle-mode-button"]');
    
    // Write comprehensive summary
    const summaryInput = page.locator('[data-testid="summary-input"]');
    const summaryText = 'This content covers three main points: ' +
      '1) The concept of X which relates to Y. ' +
      '2) The importance of Z in real-world applications. ' +
      '3) How these ideas connect to form a comprehensive understanding.';
    
    await summaryInput.fill(summaryText);
    
    // Wait for autosave
    await page.waitForTimeout(3000);
    await expect(page.locator('[data-testid="save-indicator"]')).toHaveText(/saved/i);
    
    // Navigate away
    await page.goto('/dashboard');
    
    // Return to content
    await page.click('[data-testid="content-item"]:first-child');
    await page.waitForURL(/\/contents\/.+/);
    
    // Verify summary persisted
    const persistedSummary = await summaryInput.inputValue();
    expect(persistedSummary).toBe(summaryText);
  });
  
  test('should handle concurrent edits to different sections', async ({ page }) => {
    await page.click('[data-testid="toggle-mode-button"]');
    
    // Edit cue column
    const cueInput = page.locator('[data-testid="cue-column-input"]');
    await cueInput.fill('Cue 1\nCue 2\nCue 3');
    
    // Edit summary (before autosave completes)
    const summaryInput = page.locator('[data-testid="summary-input"]');
    await summaryInput.fill('Summary text that overlaps with cue save');
    
    // Wait for all autosaves
    await page.waitForTimeout(4000);
    
    // Reload and verify both persisted
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    const cue = await cueInput.inputValue();
    const summary = await summaryInput.inputValue();
    
    expect(cue).toContain('Cue 1');
    expect(summary).toContain('Summary text');
  });
  
  test('should show error on save failure and retry', async ({ page }) => {
    // Mock API to fail
    await page.route('**/api/contents/*/cornell', route => {
      route.abort('failed');
    });
    
    await page.click('[data-testid="toggle-mode-button"]');
    
    const cueInput = page.locator('[data-testid="cue-column-input"]');
    await cueInput.fill('This will fail to save');
    
    // Wait for autosave attempt
    await page.waitForTimeout(3000);
    
    // Should show error
    await expect(page.locator('[data-testid="save-error"]')).toBeVisible();
    
    // Remove mock to allow retry
    await page.unroute('**/api/contents/*/cornell');
    
    // Click retry button
    await page.click('[data-testid="retry-save-button"]');
    
    // Should succeed
    await expect(page.locator('[data-testid="save-indicator"]')).toHaveText(/saved/i);
  });
});
