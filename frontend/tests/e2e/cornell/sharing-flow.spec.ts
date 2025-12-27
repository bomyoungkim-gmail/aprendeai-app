/**
 * E2E Tests: Cornell Highlights Sharing Flow
 * 
 * Tests granular sharing: PRIVATE → GROUP → PUBLIC
 */

import { test, expect } from '@playwright/test';
import {
  login,
  navigateToContent,
  createHighlight,
} from '../helpers/cornell-helpers';

const TEST_CONTENT_ID = 'test-content-123';

test.describe('Cornell Highlights Sharing Flow', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await navigateToContent(page, TEST_CONTENT_ID);
  });

  test('should create PRIVATE highlight', async ({ page }) => {
    await createHighlight(page, 'NOTE', 'Private note', 'PRIVATE');
    
    // Verify visibility in API
    const response = await page.request.get(`/api/v1/cornell/contents/${TEST_CONTENT_ID}/highlights`);
    const highlights = await response.json();
    
    const privateHighlight = highlights.find((h: any) => h.commentText === 'Private note');
    expect(privateHighlight).toBeDefined();
    expect(privateHighlight.visibility).toBe('PRIVATE');
  });

  test('should change visibility from PRIVATE to GROUP', async ({ page }) => {
    // Create as PRIVATE
    await createHighlight(page, 'NOTE', 'Will be shared', 'PRIVATE');
    
    // Open visibility editor
    const highlightItem = page.locator('[data-testid="highlight-item"]:has-text("Will be shared")');
    await highlightItem.hover();
    await highlightItem.locator('[data-testid="visibility-button"]').click();
    
    // Change to GROUP
    await page.selectOption('[data-testid="visibility-select"]', 'GROUP');
    await page.selectOption('[data-testid="scope-select"]', 'CLASS_PROJECT');
    await page.selectOption('[data-testid="context-select"]', 'test-institution-1');
    await page.click('[data-testid="save-visibility"]');
    
    // Wait for update
    await page.waitForTimeout(500);
    
    // Verify in API
    const response = await page.request.get(`/api/v1/cornell/contents/${TEST_CONTENT_ID}/highlights`);
    const highlights = await response.json();
    
    const sharedHighlight = highlights.find((h: any) => h.commentText === 'Will be shared');
    expect(sharedHighlight.visibility).toBe('GROUP');
    expect(sharedHighlight.visibilityScope).toBe('CLASS_PROJECT');
  });

  test('should change visibility to PUBLIC', async ({ page }) => {
    // Create as PRIVATE
    await createHighlight(page, 'STAR', 'Public knowledge', 'PRIVATE');
    
    // Open visibility editor
    const highlightItem = page.locator('[data-testid="highlight-item"]:has-text("Public knowledge")');
    await highlightItem.hover();
    await highlightItem.locator('[data-testid="visibility-button"]').click();
    
    // Change to PUBLIC
    await page.selectOption('[data-testid="visibility-select"]', 'PUBLIC');
    await page.click('[data-testid="save-visibility"]');
    
    // Wait for update
    await page.waitForTimeout(500);
    
    // Verify in API
    const response = await page.request.get(`/api/v1/cornell/contents/${TEST_CONTENT_ID}/highlights`);
    const highlights = await response.json();
    
    const publicHighlight = highlights.find((h: any) => h.commentText === 'Public knowledge');
    expect(publicHighlight.visibility).toBe('PUBLIC');
  });

  test('should validate ONLY_EDUCATORS scope', async ({ page }) => {
    // Create with educator-only scope
    await createHighlight(page, 'QUESTION', 'Teacher only note', 'PRIVATE');
    
    const highlightItem = page.locator('[data-testid="highlight-item"]:has-text("Teacher only note")');
    await highlightItem.hover();
    await highlightItem.locator('[data-testid="visibility-button"]').click();
    
    await page.selectOption('[data-testid="visibility-select"]', 'GROUP');
    await page.selectOption('[data-testid="scope-select"]', 'ONLY_EDUCATORS');
    await page.selectOption('[data-testid="context-select"]', 'test-institution-1');
    await page.click('[data-testid="save-visibility"]');
    
    await page.waitForTimeout(500);
    
    // Verify in API
    const response = await page.request.get(`/api/v1/cornell/contents/${TEST_CONTENT_ID}/highlights`);
    const highlights = await response.json();
    
    const educatorHighlight = highlights.find((h: any) => h.commentText === 'Teacher only note');
    expect(educatorHighlight.visibilityScope).toBe('ONLY_EDUCATORS');
  });
});
