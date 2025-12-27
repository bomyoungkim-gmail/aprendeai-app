/**
 * E2E Tests: Cornell Highlights Offline Flow
 * 
 * Tests offline resilience: Queue → Sync
 */

import { test, expect } from '@playwright/test';
import {
  login,
  navigateToContent,
  createHighlight,
  waitForSync,
  getHighlightCount,
} from '../helpers/cornell-helpers';

const TEST_CONTENT_ID = 'test-content-123';

test.describe('Cornell Highlights Offline Flow', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await navigateToContent(page, TEST_CONTENT_ID);
  });

  test('should queue operation when offline', async ({ page, context }) => {
    // Go offline
    await context.setOffline(true);
    
    // Try to create highlight
    await createHighlight(page, 'NOTE', 'Offline note');
    
    // Verify queue indicator appears
    await expect(page.locator('[data-testid="queue-indicator"]')).toBeVisible();
    await expect(page.locator('text=1 queued')).toBeVisible();
    
    // Verify NOT in API yet (still queued)
    const initialCount = await getHighlightCount(page, TEST_CONTENT_ID);
    
    // Go back online
    await context.setOffline(false);
    
    // Wait for sync
    const synced = await waitForSync(page);
    expect(synced).toBe(true);
    
    // Verify queue indicator disappears
    await expect(page.locator('[data-testid="queue-indicator"]')).not.toBeVisible();
    
    // Verify in API after sync
    const finalCount = await getHighlightCount(page, TEST_CONTENT_ID);
    expect(finalCount).toBe(initialCount + 1);
    
    // Verify exact highlight exists
    const response = await page.request.get(`/api/v1/cornell/contents/${TEST_CONTENT_ID}/highlights`);
    const highlights = await response.json();
    const offlineNote = highlights.find((h: any) => h.commentText === 'Offline note');
    expect(offlineNote).toBeDefined();
  });

  test('should queue multiple operations', async ({ page, context }) => {
    // Go offline
    await context.setOffline(true);
    
    // Create multiple highlights
    await createHighlight(page, 'NOTE', 'Offline note 1');
    await createHighlight(page, 'QUESTION', 'Offline question 1');
    await createHighlight(page, 'STAR', 'Offline star 1');
    
    // Verify queue count
    await expect(page.locator('text=3 queued')).toBeVisible();
    
    // Go back online
    await context.setOffline(false);
    
    // Wait for sync
    const synced = await waitForSync(page);
    expect(synced).toBe(true);
    
    // Verify all synced
    const response = await page.request.get(`/api/v1/cornell/contents/${TEST_CONTENT_ID}/highlights`);
    const highlights = await response.json();
    
    expect(highlights.some((h: any) => h.commentText === 'Offline note 1')).toBe(true);
    expect(highlights.some((h: any) => h.commentText === 'Offline question 1')).toBe(true);
    expect(highlights.some((h: any) => h.commentText === 'Offline star 1')).toBe(true);
  });

  test('should persist queue across page reload', async ({ page, context }) => {
    // Go offline
    await context.setOffline(true);
    
    // Create highlight
    await createHighlight(page, 'HIGHLIGHT', 'Persisted note');
    
    // Verify queued
    await expect(page.locator('text=1 queued')).toBeVisible();
    
    // Reload page (still offline)
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // Verify queue persisted
    await expect(page.locator('text=1 queued')).toBeVisible();
    
    // Go online
    await context.setOffline(false);
    
    // Wait for sync
    const synced = await waitForSync(page);
    expect(synced).toBe(true);
    
    // Verify synced
    const response = await page.request.get(`/api/v1/cornell/contents/${TEST_CONTENT_ID}/highlights`);
    const highlights = await response.json();
    const persistedNote = highlights.find((h: any) => h.commentText === 'Persisted note');
    expect(persistedNote).toBeDefined();
  });
});
