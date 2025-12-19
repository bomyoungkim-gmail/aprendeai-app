import { test, expect } from '@playwright/test';
import { TEST_USERS, TEST_CONTENT } from '../fixtures/test-data';
import { loginAs, uploadContent } from '../helpers/test-helpers';
import * as path from 'path';

/**
 * Content Upload E2E Tests
 * 
 * Tests file upload functionality with validation
 */

test.describe('Content Upload', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await loginAs(page, TEST_USERS.facilitator.email);
  });

  test('user can upload PDF file', async ({ page }) => {
    const testFile = path.join(__dirname, '../fixtures/test-document.pdf');
    
    await page.goto('/dashboard');
    
    // Click upload button
    await page.click('button:has-text("Upload"), button:has-text("Fazer Upload")');
    
    // Modal should be visible
    await expect(page.locator('text=/Upload.*Conteúdo|Upload Content/i')).toBeVisible();
    
    // Upload file
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(testFile);
    
    // File name should appear
    await expect(page.locator('text=test-document.pdf')).toBeVisible();
    
    // Fill title
    await page.fill('input[name="title"]', 'E2E Test PDF');
    
    // Click upload button in modal
    const uploadBtn = page.locator('button:has-text("Upload"):not(:disabled)').last();
    await uploadBtn.click();
    
    // Wait for upload to complete (modal closes)
    await expect(page.locator('text=/Upload.*Conteúdo/i')).toBeHidden({ timeout: 15000 });
    
    // Content should appear in list
    await expect(page.locator('text=E2E Test PDF')).toBeVisible({ timeout: 5000 });
  });

  test('upload validates file type - rejects invalid files', async ({ page }) => {
    await page.goto('/dashboard');
    
    await page.click('button:has-text("Fazer Upload")');
    
    // Try to upload an invalid file type (e.g., image)
    const invalidFile = path.join(__dirname, '../fixtures/invalid-file.jpg');
    
    const fileInput = page.locator('input[type="file"]');
    
    // Upload won't accept the file, or will show error
    await fileInput.setInputFiles(invalidFile);
    
    // Should show error message
    await expect(page.locator('text=/não suportado|not supported|invalid/i')).toBeVisible({ timeout: 3000 });
  });

  test('upload validates file size - rejects files >20MB', async ({ page }) => {
    // This test would need a 20MB+ file fixture
    // Skipping actual implementation for now
    test.skip();
  });

  test.skip('user can upload DOCX file', async ({ page }) => {
    const testFile = path.join(__dirname, '../fixtures/test-document.docx');
    
    await uploadContent(page, testFile, 'E2E Test DOCX');
    
    // Verify it appears
    await expect(page.locator('text=E2E Test DOCX')).toBeVisible();
  });

  test.skip('user can upload TXT file', async ({ page }) => {
    const testFile = path.join(__dirname, '../fixtures/test-document.txt');
    
    await uploadContent(page, testFile, 'E2E Test TXT');
    
    await expect(page.locator('text=E2E Test TXT')).toBeVisible();
  });

  test.skip('uploaded content opens in Cornell Reader', async ({ page }) => {
    const testFile = path.join(__dirname, '../fixtures/test-document.pdf');
    
    await uploadContent(page, testFile, 'Cornell Test');
    
    // Click on the content
    await page.click('text=Cornell Test');
    
    // Should navigate to Cornell reader
    await expect(page).toHaveURL(/\/cornell|\/reader/);
    
    // Cornell interface should be visible
    await expect(page.locator('text=/Notes|Anotações|Cornell/i')).toBeVisible();
  });
});
