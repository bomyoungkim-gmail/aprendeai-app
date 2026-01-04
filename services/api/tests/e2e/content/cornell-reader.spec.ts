import { test, expect } from "@playwright/test";
import { TEST_USERS } from "../fixtures/test-data";
import { loginAs } from "../helpers/test-helpers";

/**
 * Cornell Reader E2E Tests
 *
 * Tests Cornell notes, highlights, and Q&A card creation
 */

test.describe("Cornell Reader", () => {
  let contentId: string;

  test.beforeEach(async ({ page }) => {
    await loginAs(page, TEST_USERS.facilitator.email);
    contentId = "test-content-id"; // Would come from setup
  });

  test("user can create Cornell notes", async ({ page }) => {
    await page.goto(`/cornell/${contentId}`);

    // Notes textarea should be visible
    const notesArea = page.locator(
      'textarea[placeholder*="Notes"], textarea[name="notes"]',
    );
    await expect(notesArea).toBeVisible();

    // Type notes
    await notesArea.fill("Test Cornell notes here");

    // Blur to trigger auto-save
    await notesArea.blur();

    // Wait for save (look for indicator or just wait)
    await page.waitForTimeout(1000);

    // Refresh page
    await page.reload();

    // Notes should persist
    await expect(notesArea).toHaveValue("Test Cornell notes here");
  });

  test("notes auto-save on blur", async ({ page }) => {
    await page.goto(`/cornell/${contentId}`);

    const notesArea = page.locator('textarea[name="notes"]');

    // Type
    await notesArea.fill("Auto-save test");

    // Blur
    await notesArea.blur();

    // Look for save indicator
    await expect(page.locator("text=/Saved|Salvo/i")).toBeVisible({
      timeout: 3000,
    });
  });

  test("user can create highlight", async ({ page }) => {
    await page.goto(`/cornell/${contentId}`);

    // Select text (this is tricky in Playwright, simplified)
    const textElement = page.locator("text=Sample text to highlight").first();
    await textElement.click({ clickCount: 3 }); // Triple click to select

    // Highlight button appears
    await page.click(
      'button:has-text("Highlight"), button[title*="Highlight"]',
    );

    // Highlight should be visible
    await expect(page.locator(".highlight, mark")).toBeVisible();
  });

  test("highlights persist after refresh", async ({ page }) => {
    await page.goto(`/cornell/${contentId}`);

    // Assume highlight already exists
    await expect(page.locator(".highlight, mark")).toBeVisible();

    // Refresh
    await page.reload();

    // Highlight still visible
    await expect(page.locator(".highlight, mark")).toBeVisible();
  });

  test("user can generate Q&A cards from highlight", async ({ page }) => {
    await page.goto(`/cornell/${contentId}`);

    // Click on existing highlight
    await page.click(".highlight, mark");

    // Generate Q&A button
    await page.click(
      'button:has-text("Generate Q&A"), button:has-text("Gerar Pergunta")',
    );

    // Q&A card should appear in sidebar
    await expect(page.locator('[data-testid="qa-card"]')).toBeVisible({
      timeout: 5000,
    });
  });

  test("Q&A card shows in sidebar", async ({ page }) => {
    await page.goto(`/cornell/${contentId}`);

    // Sidebar should have Q&A section
    await expect(page.locator("text=/Q&A|Questions/i")).toBeVisible();

    // Card should be visible
    await expect(page.locator('[data-testid="qa-card"]')).toBeVisible();

    // Card should have question and answer
    await expect(page.locator("text=/Question|Pergunta/i")).toBeVisible();
  });
});
