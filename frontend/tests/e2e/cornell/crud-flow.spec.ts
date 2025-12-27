/**
 * E2E Tests: Cornell Highlights CRUD Flow
 * 
 * Tests complete lifecycle: Create → Read → Update → Delete
 */

import { test, expect } from '@playwright/test';
import {
  login,
  navigateToContent,
  createHighlight,
  verifyHighlightExists,
  deleteHighlight,
  getHighlightCount,
} from '../helpers/cornell-helpers';

const TEST_CONTENT_ID = 'test-content-123';

test.describe('Cornell Highlights CRUD Flow', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await navigateToContent(page, TEST_CONTENT_ID);
  });

  test('should create a NOTE highlight', async ({ page }) => {
    const initialCount = await getHighlightCount(page, TEST_CONTENT_ID);
    
    await createHighlight(page, 'NOTE', 'Important concept about photosynthesis');
    
    // Verify in UI
    await verifyHighlightExists(page, 'Important concept about photosynthesis');
    
    // Verify color (green for NOTE)
    await expect(page.locator('.bg-green-50')).toBeVisible();
    
    // Verify in API
    const newCount = await getHighlightCount(page, TEST_CONTENT_ID);
    expect(newCount).toBe(initialCount + 1);
  });

  test('should create a QUESTION highlight', async ({ page }) => {
    await createHighlight(page, 'QUESTION', 'What does this mean?');
    
    // Verify in UI
    await verifyHighlightExists(page, 'What does this mean?');
    
    // Verify color (red for QUESTION)
    await expect(page.locator('.bg-red-50')).toBeVisible();
  });

  test('should create a STAR highlight', async ({ page }) => {
    await createHighlight(page, 'STAR', 'Key concept to remember');
    
    // Verify in UI
    await verifyHighlightExists(page, 'Key concept to remember');
    
    // Verify color (yellow for STAR)
    await expect(page.locator('.bg-yellow-50')).toBeVisible();
  });

  test('should update highlight comment', async ({ page }) => {
    // Create
    await createHighlight(page, 'NOTE', 'Original note');
    
    // Edit
    const highlightItem = page.locator('[data-testid="highlight-item"]:has-text("Original note")');
    await highlightItem.hover();
    await highlightItem.locator('[data-testid="edit-button"]').click();
    
    // Update comment
    await page.fill('[data-testid="highlight-comment"]', 'Updated note with more details');
    await page.click('[data-testid="save-highlight"]');
    
    // Verify updated
    await verifyHighlightExists(page, 'Updated note with more details');
    await expect(page.locator('text=Original note')).not.toBeVisible();
  });

  test('should delete highlight', async ({ page }) => {
    // Create
    await createHighlight(page, 'HIGHLIGHT', 'Note to delete');
    
    const beforeCount = await getHighlightCount(page, TEST_CONTENT_ID);
    
    // Delete
    await deleteHighlight(page, 'Note to delete');
    
    // Verify removed from UI
    await expect(page.locator('text=Note to delete')).not.toBeVisible();
    
    // Verify in API (soft delete)
    const afterCount = await getHighlightCount(page, TEST_CONTENT_ID);
    expect(afterCount).toBe(beforeCount - 1);
  });

  test('should complete full CRUD lifecycle', async ({ page }) => {
    // CREATE
    await createHighlight(page, 'NOTE', 'Lifecycle test note');
    await verifyHighlightExists(page, 'Lifecycle test note');
    
    // READ - already verified above
    
    // UPDATE
    const highlightItem = page.locator('[data-testid="highlight-item"]:has-text("Lifecycle test note")');
    await highlightItem.hover();
    await highlightItem.locator('[data-testid="edit-button"]').click();
    await page.fill('[data-testid="highlight-comment"]', 'Updated lifecycle note');
    await page.click('[data-testid="save-highlight"]');
    await verifyHighlightExists(page, 'Updated lifecycle note');
    
    // DELETE
    await deleteHighlight(page, 'Updated lifecycle note');
    await expect(page.locator('text=Updated lifecycle note')).not.toBeVisible();
  });
});
