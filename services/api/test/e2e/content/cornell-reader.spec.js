"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const test_1 = require("@playwright/test");
const test_data_1 = require("../fixtures/test-data");
const test_helpers_1 = require("../helpers/test-helpers");
test_1.test.describe("Cornell Reader", () => {
    let contentId;
    test_1.test.beforeEach(async ({ page }) => {
        await (0, test_helpers_1.loginAs)(page, test_data_1.TEST_USERS.facilitator.email);
        contentId = "test-content-id";
    });
    (0, test_1.test)("user can create Cornell notes", async ({ page }) => {
        await page.goto(`/cornell/${contentId}`);
        const notesArea = page.locator('textarea[placeholder*="Notes"], textarea[name="notes"]');
        await (0, test_1.expect)(notesArea).toBeVisible();
        await notesArea.fill("Test Cornell notes here");
        await notesArea.blur();
        await page.waitForTimeout(1000);
        await page.reload();
        await (0, test_1.expect)(notesArea).toHaveValue("Test Cornell notes here");
    });
    (0, test_1.test)("notes auto-save on blur", async ({ page }) => {
        await page.goto(`/cornell/${contentId}`);
        const notesArea = page.locator('textarea[name="notes"]');
        await notesArea.fill("Auto-save test");
        await notesArea.blur();
        await (0, test_1.expect)(page.locator("text=/Saved|Salvo/i")).toBeVisible({
            timeout: 3000,
        });
    });
    (0, test_1.test)("user can create highlight", async ({ page }) => {
        await page.goto(`/cornell/${contentId}`);
        const textElement = page.locator("text=Sample text to highlight").first();
        await textElement.click({ clickCount: 3 });
        await page.click('button:has-text("Highlight"), button[title*="Highlight"]');
        await (0, test_1.expect)(page.locator(".highlight, mark")).toBeVisible();
    });
    (0, test_1.test)("highlights persist after refresh", async ({ page }) => {
        await page.goto(`/cornell/${contentId}`);
        await (0, test_1.expect)(page.locator(".highlight, mark")).toBeVisible();
        await page.reload();
        await (0, test_1.expect)(page.locator(".highlight, mark")).toBeVisible();
    });
    (0, test_1.test)("user can generate Q&A cards from highlight", async ({ page }) => {
        await page.goto(`/cornell/${contentId}`);
        await page.click(".highlight, mark");
        await page.click('button:has-text("Generate Q&A"), button:has-text("Gerar Pergunta")');
        await (0, test_1.expect)(page.locator('[data-testid="qa-card"]')).toBeVisible({
            timeout: 5000,
        });
    });
    (0, test_1.test)("Q&A card shows in sidebar", async ({ page }) => {
        await page.goto(`/cornell/${contentId}`);
        await (0, test_1.expect)(page.locator("text=/Q&A|Questions/i")).toBeVisible();
        await (0, test_1.expect)(page.locator('[data-testid="qa-card"]')).toBeVisible();
        await (0, test_1.expect)(page.locator("text=/Question|Pergunta/i")).toBeVisible();
    });
});
//# sourceMappingURL=cornell-reader.spec.js.map