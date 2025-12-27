/**
 * Cornell E2E Test Helpers
 * 
 * Reusable helper functions for E2E tests.
 */

import { Page, expect } from '@playwright/test';

/**
 * Login helper
 */
export async function login(page: Page, email = 'maria@example.com', password = 'demo123') {
  await page.goto('/login');
  await page.fill('[data-testid="email"]', email);
  await page.fill('[data-testid="password"]', password);
  await page.click('[data-testid="login-button"]');
  
  // Wait for redirect
  await page.waitForURL(/\/dashboard|\/content/);
}

/**
 * Navigate to content with highlights
 */
export async function navigateToContent(page: Page, contentId: string) {
  await page.goto(`/content/${contentId}`);
  await page.waitForLoadState('networkidle');
}

/**
 * Create a Cornell highlight
 */
export async function createHighlight(
  page: Page,
  type: 'NOTE' | 'QUESTION' | 'STAR' | 'HIGHLIGHT',
  comment: string,
  visibility = 'PRIVATE'
) {
  await page.click('[data-testid="add-highlight"]');
  
  // Select type
  await page.click(`[data-testid="cornell-type-${type.toLowerCase()}"]`);
  
  // Add comment
  if (comment) {
    await page.fill('[data-testid="highlight-comment"]', comment);
  }
  
  // Set visibility
  if (visibility !== 'PRIVATE') {
    await page.selectOption('[data-testid="visibility-select"]', visibility);
  }
  
  // Save
  await page.click('[data-testid="save-highlight"]');
  
  // Wait for creation
  await page.waitForTimeout(500);
}

/**
 * Wait for offline sync to complete
 */
export async function waitForSync(page: Page, maxWaitMs = 5000) {
  const startTime = Date.now();
  
  while (Date.now() - startTime < maxWaitMs) {
    const queueIndicator = page.locator('[data-testid="queue-indicator"]');
    const isVisible = await queueIndicator.isVisible().catch(() => false);
    
    if (!isVisible) {
      // Sync complete
      return true;
    }
    
    await page.waitForTimeout(500);
  }
  
  return false;
}

/**
 * Get highlight count from API
 */
export async function getHighlightCount(page: Page, contentId: string): Promise<number> {
  const response = await page.request.get(`/api/v1/cornell/contents/${contentId}/highlights`);
  
  if (!response.ok()) {
    throw new Error(`Failed to fetch highlights: ${response.status()}`);
  }
  
  const highlights = await response.json();
  return highlights.length;
}

/**
 * Verify highlight exists in DOM
 */
export async function verifyHighlightExists(page: Page, comment: string) {
  await expect(page.locator(`text=${comment}`)).toBeVisible();
}

/**
 * Delete highlight
 */
export async function deleteHighlight(page: Page, comment: string) {
  // Find highlight item
  const highlightItem = page.locator(`[data-testid="highlight-item"]:has-text("${comment}")`);
  
  // Hover to show actions
  await highlightItem.hover();
  
  // Click delete
  await highlightItem.locator('[data-testid="delete-button"]').click();
  
  // Confirm
  await page.click('[data-testid="confirm-delete"]');
  
  // Wait for deletion
  await page.waitForTimeout(500);
}
