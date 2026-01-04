"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const test_1 = require("@playwright/test");
const test_data_1 = require("../fixtures/test-data");
const test_helpers_1 = require("../helpers/test-helpers");
const path = require("path");
test_1.test.describe("Content Upload", () => {
    test_1.test.beforeEach(async ({ page }) => {
        await (0, test_helpers_1.loginAs)(page, test_data_1.TEST_USERS.facilitator.email);
    });
    (0, test_1.test)("user can upload PDF file", async ({ page }) => {
        const testFile = path.join(__dirname, "../fixtures/test-document.pdf");
        await page.goto("/dashboard");
        await page.click('button:has-text("Upload"), button:has-text("Fazer Upload")');
        await (0, test_1.expect)(page.locator("text=/Upload.*Conteúdo|Upload Content/i")).toBeVisible();
        const fileInput = page.locator('input[type="file"]');
        await fileInput.setInputFiles(testFile);
        await (0, test_1.expect)(page.locator("text=test-document.pdf")).toBeVisible();
        await page.fill('input[name="title"]', "E2E Test PDF");
        const uploadBtn = page
            .locator('button:has-text("Upload"):not(:disabled)')
            .last();
        await uploadBtn.click();
        await (0, test_1.expect)(page.locator("text=/Upload.*Conteúdo/i")).toBeHidden({
            timeout: 15000,
        });
        await (0, test_1.expect)(page.locator("text=E2E Test PDF")).toBeVisible({
            timeout: 5000,
        });
    });
    (0, test_1.test)("upload validates file type - rejects invalid files", async ({ page, }) => {
        await page.goto("/dashboard");
        await page.click('button:has-text("Fazer Upload")');
        const invalidFile = path.join(__dirname, "../fixtures/invalid-file.jpg");
        const fileInput = page.locator('input[type="file"]');
        await fileInput.setInputFiles(invalidFile);
        await (0, test_1.expect)(page.locator("text=/não suportado|not supported|invalid/i")).toBeVisible({ timeout: 3000 });
    });
    (0, test_1.test)("upload validates file size - rejects files >20MB", async ({ page }) => {
        test_1.test.skip();
    });
    test_1.test.skip("user can upload DOCX file", async ({ page }) => {
        const testFile = path.join(__dirname, "../fixtures/test-document.docx");
        await (0, test_helpers_1.uploadContent)(page, testFile, "E2E Test DOCX");
        await (0, test_1.expect)(page.locator("text=E2E Test DOCX")).toBeVisible();
    });
    test_1.test.skip("user can upload TXT file", async ({ page }) => {
        const testFile = path.join(__dirname, "../fixtures/test-document.txt");
        await (0, test_helpers_1.uploadContent)(page, testFile, "E2E Test TXT");
        await (0, test_1.expect)(page.locator("text=E2E Test TXT")).toBeVisible();
    });
    test_1.test.skip("uploaded content opens in Cornell Reader", async ({ page }) => {
        const testFile = path.join(__dirname, "../fixtures/test-document.pdf");
        await (0, test_helpers_1.uploadContent)(page, testFile, "Cornell Test");
        await page.click("text=Cornell Test");
        await (0, test_1.expect)(page).toHaveURL(/\/cornell|\/reader/);
        await (0, test_1.expect)(page.locator("text=/Notes|Anotações|Cornell/i")).toBeVisible();
    });
});
//# sourceMappingURL=upload.spec.js.map