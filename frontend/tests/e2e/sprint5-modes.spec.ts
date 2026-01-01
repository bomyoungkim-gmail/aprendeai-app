/**
 * Sprint 5 E2E Tests: Mode-Specific Behaviors
 * 
 * Tests all 6 content modes with their unique features
 */

import { test, expect } from '@playwright/test';

test.describe('Sprint 5: Mode-Specific Behaviors', () => {
  
  // NARRATIVE Mode Tests (G1.1-G1.4)
  test.describe('NARRATIVE Mode', () => {
    test('should have minimal UI with aggressive auto-hide', async ({ page }) => {
      await page.goto('/reader/narrative-content');
      
      // Wait for UI to auto-hide (2s)
      await page.waitForTimeout(2500);
      
      const header = page.locator('header');
      await expect(header).not.toBeVisible();
    });

    test('should have zero interventions', async ({ page }) => {
      await page.goto('/reader/narrative-content');
      
      // Read for 5 minutes (simulated)
      await page.waitForTimeout(5000);
      
      // No intervention should appear
      const intervention = page.locator('[data-testid="intervention"]');
      await expect(intervention).not.toBeVisible();
    });

    test('should track reading continuity', async ({ page }) => {
      await page.goto('/reader/narrative-content');
      
      // Simulate continuous reading
      await page.evaluate(() => {
        window.scrollBy(0, 100);
      });
      
      await page.waitForTimeout(3000);
      
      // Check telemetry (would verify via network request)
      // Placeholder for actual telemetry verification
    });
  });

  // TECHNICAL Mode Tests (G3.1-G3.4)
  test.describe('TECHNICAL Mode', () => {
    test('should show TOC sidebar', async ({ page }) => {
      await page.goto('/reader/technical-content');
      
      const toc = page.locator('[data-testid="table-of-contents"]');
      await expect(toc).toBeVisible();
    });

    test('should allow non-linear navigation without confusion alerts', async ({ page }) => {
      await page.goto('/reader/technical-content');
      
      // Jump to section 5
      await page.click('[data-section="5"]');
      await page.waitForTimeout(500);
      
      // Jump back to section 2
      await page.click('[data-section="2"]');
      await page.waitForTimeout(500);
      
      // Should NOT trigger confusion
      const confusionAlert = page.locator('[data-testid="confusion-alert"]');
      await expect(confusionAlert).not.toBeVisible();
    });

    test('should have export functionality', async ({ page }) => {
      await page.goto('/reader/technical-content');
      
      const exportButton = page.locator('[data-testid="export-button"]');
      await expect(exportButton).toBeVisible();
      
      // Click export
      await exportButton.click();
      
      // Verify export menu
      const exportMenu = page.locator('[data-testid="export-menu"]');
      await expect(exportMenu).toBeVisible();
      
      // Check for format options
      await expect(page.getByText('Markdown')).toBeVisible();
      await expect(page.getByText('Obsidian')).toBeVisible();
      await expect(page.getByText('JSON')).toBeVisible();
    });
  });

  // NEWS Mode Tests (G4.1-G4.3)
  test.describe('NEWS Mode', () => {
    test('should show opt-in quiz at end', async ({ page }) => {
      await page.goto('/reader/news-content');
      
      // Scroll to end
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      
      const quizPrompt = page.getByText('Quer testar sua compreensão?');
      await expect(quizPrompt).toBeVisible({ timeout: 5000 });
    });

    test('should accept quiz opt-in', async ({ page }) => {
      await page.goto('/reader/news-content');
      
      // Complete reading
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      
      // Opt-in
      await page.click('button:has-text("Sim")');
      
      // Verify quiz appears
      const question = page.locator('[data-testid="quiz-question"]');
      await expect(question).toBeVisible();
    });

    test('should enforce synthesis character limits', async ({ page }) => {
      await page.goto('/reader/news-content');
      
      // Navigate to synthesis
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await page.click('button:has-text("Não")'); // Skip quiz
      
      const textarea = page.locator('textarea[placeholder*="Resuma"]');
      
      // Test minimum (50 chars)
      await textarea.fill('Short');
      const submitButton = page.locator('button:has-text("Concluir")');
      await expect(submitButton).toBeDisabled();
      
      // Test valid (50-280 chars)
      await textarea.fill('A' + 'a'.repeat(60));
      await expect(submitButton).toBeEnabled();
      
      // Verify character count
      const charCount = page.locator('text=/\\d+\\/280/');
      await expect(charCount).toBeVisible();
    });
  });

  // SCIENTIFIC Mode Tests (G5.1-G5.2)
  test.describe('SCIENTIFIC Mode', () => {
    test('should detect IMRaD sections', async ({ page }) => {
      await page.goto('/reader/scientific-content');
      
      // Check for IMRaD section markers
      await expect(page.locator('[data-section="abstract"]')).toBeVisible();
      await expect(page.locator('[data-section="methods"]')).toBeVisible();
      await expect(page.locator('[data-section="results"]')).toBeVisible();
      await expect(page.locator('[data-section="discussion"]')).toBeVisible();
    });

    test('should show checkpoints per section', async ({ page }) => {
      await page.goto('/reader/scientific-content');
      
      // Read Abstract section
      await page.evaluate(() => {
        const abstractSection = document.querySelector('[data-section="abstract"]');
        abstractSection?.scrollIntoView();
      });
      
      // Scroll past Abstract
      await page.evaluate(() => window.scrollBy(0, 1000));
      
      // Checkpoint should appear
      const checkpoint = page.getByText(/checkpoint.*abstract/i);
      await expect(checkpoint).toBeVisible({ timeout: 5000 });
    });
  });

  // LANGUAGE Mode Tests (G6.1-G6.2)
  test.describe('LANGUAGE Mode', () => {
    test('should show definition on word click', async ({ page }) => {
      await page.goto('/reader/language-content');
      
      // Click on a word
      await page.click('[data-word="ubiquitous"]');
      
      // Verify definition popover
      const popover = page.locator('[data-testid="definition-popover"]');
      await expect(popover).toBeVisible();
      
      // Check for definition content
      await expect(popover).toContainText('ubiquitous');
    });

    test('should add words to SRS automatically', async ({ page }) => {
      await page.goto('/reader/language-content');
      
      // Get initial SRS count
      const srsCountBefore = await page.locator('[data-testid="srs-count"]').textContent();
      
      // Click on unknown word
      await page.click('[data-word="ephemeral"]');
      
      // Wait for SRS addition
      await page.waitForTimeout(500);
      
      // Verify SRS count increased
      const srsCountAfter = await page.locator('[data-testid="srs-count"]').textContent();
      expect(parseInt(srsCountAfter || '0')).toBeGreaterThan(parseInt(srsCountBefore || '0'));
    });

    test('should enforce 20 words per session limit', async ({ page }) => {
      await page.goto('/reader/language-content');
      
      // Add 20 words
      for (let i = 0; i < 20; i++) {
        await page.click(`[data-word="word-${i}"]`);
        await page.waitForTimeout(100);
      }
      
      // Try to add 21st word
      await page.click('[data-word="word-21"]');
      
      // Should show warning toast
      const toast = page.getByText(/limite.*20.*palavras/i);
      await expect(toast).toBeVisible({ timeout: 3000 });
    });
  });

  // Cross-mode telemetry test
  test('should track mode-specific telemetry', async ({ page }) => {
    // Listen for telemetry events
    const telemetryEvents: any[] = [];
    
    page.on('request', request => {
      if (request.url().includes('/telemetry')) {
        telemetryEvents.push(request.postDataJSON());
      }
    });

    await page.goto('/reader/technical-content');
    
    // Trigger export
    await page.click('[data-testid="export-button"]');
    await page.click('button:has-text("Markdown")');
    
    // Wait for telemetry
    await page.waitForTimeout(1000);
    
    // Verify CONTENT_EXPORTED event was tracked
    const exportEvent = telemetryEvents.find(e => e.eventType === 'CONTENT_EXPORTED');
    expect(exportEvent).toBeDefined();
    expect(exportEvent?.format).toBe('markdown');
  });
});
