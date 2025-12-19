/**
 * E2E Test - Review SRS Flow
 * 
 * Tests vocabulary review system:
 * - Access review queue
 * - Review due items
 * - Submit attempts (FAIL, HARD, OK, EASY)
 * - Verify SRS stage updates
 * - Verify due date changes
 */

import { test, expect } from '@playwright/test';

test.describe('Review SRS Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.fill('[name="email"]', 'test@example.com');
    await page.fill('[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
  });
  
  test('should display review queue with due items', async ({ page }) => {
    // Navigate to review
    await page.click('[data-testid="review-link"]');
    await page.waitForURL('/review');
    
    // Should show due count
    const dueCount = await page.locator('[data-testid="due-count"]').textContent();
    expect(parseInt(dueCount || '0')).toBeGreaterThan(0);
    
    // Should list vocab items
    await expect(page.locator('[data-testid="vocab-item"]').first()).toBeVisible();
    
    // Verify item details
    const firstItem = page.locator('[data-testid="vocab-item"]').first();
    await expect(firstItem.locator('[data-testid="word"]')).toBeVisible();
    await expect(firstItem.locator('[data-testid="srs-stage"]')).toBeVisible();
  });
  
  test('should complete review attempt with OK result', async ({ page }) => {
    await page.goto('/review');
    
    // Start first review
    await page.click('[data-testid="vocab-item"]:first-child');
    await page.waitForURL(/\/review\/.+/);
    
    // Should show word
    await expect(page.locator('[data-testid="review-word"]')).toBeVisible();
    const word = await page.locator('[data-testid="review-word"]').textContent();
    
    // Should show current stage
    const currentStage = await page.locator('[data-testid="current-stage"]').textContent();
    expect(currentStage).toMatch(/NEW|D1|D3|D7|D14|D30|D60/);
    
    // Reveal answer
    await page.click('[data-testid="show-answer-button"]');
    await expect(page.locator('[data-testid="definition"]')).toBeVisible();
    
    // Submit OK
    await page.click('[data-testid="result-ok-button"]');
    
    // Should show success
    await expect(page.locator('[data-testid="review-success"]')).toBeVisible();
    
    // Should show new stage
    const newStage = await page.locator('[data-testid="new-stage"]').textContent();
    
    // Verify stage advanced
    if (currentStage === 'NEW') expect(newStage).toBe('D1');
    if (currentStage === 'D1') expect(newStage).toBe('D3');
  });
  
  test('should reset to D1 on FAIL', async ({ page }) => {
    await page.goto('/review');
    
    // Find item with advanced stage
    await page.click('[data-testid="vocab-item"][data-stage="D7"]');
    
    // Review and fail
    await page.click('[data-testid="show-answer-button"]');
    await page.click('[data-testid="result-fail-button"]');
    
    // Should reset to D1
    const newStage = await page.locator('[data-testid="new-stage"]').textContent();
    expect(newStage).toBe('D1');
    
    // Should show lapse count incremented
    await expect(page.locator('[data-testid="lapse-count"]')).toBeVisible();
  });
  
  test('should skip stage on EASY', async ({ page }) => {
    await page.goto('/review');
    
    await page.click('[data-testid="vocab-item"]:first-child');
    
    const currentStage = await page.locator('[data-testid="current-stage"]').textContent();
    
    await page.click('[data-testid="show-answer-button"]');
    await page.click('[data-testid="result-easy-button"]');
    
    const newStage = await page.locator('[data-testid="new-stage"]').textContent();
    
    // Should skip (e.g., NEW -> D3, D1 -> D7)
    if (currentStage === 'NEW') expect(newStage).toBe('D3');
    if (currentStage === 'D1') expect(newStage).toBe('D7');
  });
  
  test('should update due date correctly', async ({ page }) => {
    await page.goto('/review');
    
    await page.click('[data-testid="vocab-item"]:first-child');
    
    // Note current due date
    const currentDue = await page.locator('[data-testid="current-due"]').textContent();
    
    await page.click('[data-testid="show-answer-button"]');
    await page.click('[data-testid="result-ok-button"]');
    
    // Should show new due date
    const newDue = await page.locator('[data-testid="new-due"]').textContent();
    
    // New due should be in future
    expect(newDue).not.toBe(currentDue);
    await expect(page.locator('[data-testid="new-due"]')).toContainText(/days from now|tomorrow|in \d+ days/i);
  });
  
  test('should respect daily review cap', async ({ page }) => {
    await page.goto('/review');
    
    // Get total due count
    const totalDue = await page.locator('[data-testid="total-due"]').textContent();
    const availableToday = await page.locator('[data-testid="available-today"]').textContent();
    
    // Should not exceed cap (usually 20)
    expect(parseInt(availableToday || '0')).toBeLessThanOrEqual(20);
    
    // If total > 20, should show message
    if (parseInt(totalDue || '0') > 20) {
      await expect(page.locator('[data-testid="cap-message"]')).toBeVisible();
      await expect(page.locator('[data-testid="cap-message"]')).toContainText(/daily limit/i);
    }
  });
  
  test('should navigate through multiple reviews', async ({ page }) => {
    await page.goto('/review');
    
    // Complete first review
    await page.click('[data-testid="vocab-item"]:first-child');
    await page.click('[data-testid="show-answer-button"]');
    await page.click('[data-testid="result-ok-button"]');
    
    // Should navigate to next
    await page.click('[data-testid="next-review-button"]');
    
    // Should show different word
    await expect(page.locator('[data-testid="review-word"]')).toBeVisible();
    
    // Complete second
    await page.click('[data-testid="show-answer-button"]');
    await page.click('[data-testid="result-easy-button"]');
    
    // Continue pattern
    await page.click('[data-testid="next-review-button"]');
    
    // Complete third
    await page.click('[data-testid="show-answer-button"]');
    await page.click('[data-testid="result-hard-button"]');
    
    // After multiple, should show progress
    await expect(page.locator('[data-testid="reviews-completed"]')).toContainText('3');
  });
  
  test('should show completion summary after finishing queue', async ({ page }) => {
    await page.goto('/review');
    
    // Review all items (simplified - in reality would loop)
    const itemCount = await page.locator('[data-testid="vocab-item"]').count();
    
    for (let i = 0; i < Math.min(itemCount, 5); i++) {
      await page.click(`[data-testid="vocab-item"]:nth-child(${i + 1})`);
      await page.click('[data-testid="show-answer-button"]');
      await page.click('[data-testid="result-ok-button"]');
      
      if (i < itemCount - 1) {
        await page.click('[data-testid="next-review-button"]');
      }
    }
    
    // Should show summary
    await expect(page.locator('[data-testid="review-summary"]')).toBeVisible();
    await expect(page.locator('[data-testid="total-reviewed"]')).toBeVisible();
    await expect(page.locator('[data-testid="accuracy-rate"]')).toBeVisible();
  });
});
