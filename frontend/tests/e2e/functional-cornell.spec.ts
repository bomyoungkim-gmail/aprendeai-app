import { test, expect } from '@playwright/test';

test.describe('Cornell Note Taking Flow E2E', () => {
  // Mock API to run independently of backend state
  test.beforeEach(async ({ page }) => {
    // Mock Content
    await page.route('**/api/contents/*', async route => {
      const json = {
        data: {
          id: 'test-content',
          title: 'E2E Test Content',
          contentType: 'PDF',
          sourceUrl: '/files/test.pdf', // Mock PDF URL
        }
      };
      await route.fulfill({ json });
    });

    // Mock Cornell Notes
    await page.route('**/api/contents/*/cornell', async route => {
      await route.fulfill({ json: { data: { notes: [], cues: [], summary: '' } } });
    });

    // Mock Unified Stream
    await page.route('**/api/contents/*/stream', async route => {
      await route.fulfill({ json: { data: [] } });
    });
    
    // Mock user auth
    await page.context().addCookies([
      { name: 'auth-token', value: 'mock-token', domain: 'localhost', path: '/' }
    ]);
  });

  test('should load reader and allow basic interaction', async ({ page }) => {
    // Navigate to reader
    await page.goto('/reader/test-content');

    // Verify title loads
    await expect(page.getByText('E2E Test Content')).toBeVisible({ timeout: 15000 });

    // Verify layout elements
    await expect(page.getByRole('banner')).toBeVisible(); // Header
    await expect(page.getByRole('complementary')).toBeVisible(); // Sidebar

    // Check tabs
    const notesTab = page.getByRole('button', { name: /Anotações/i });
    await expect(notesTab).toBeVisible();
    
    // Switch tabs
    await page.getByRole('button', { name: /Tópicos/i }).click();
    await expect(page.getByText('Nenhuma dúvida encontrada')).toBeVisible(); // Empty state
    
    // Switch back
    await notesTab.click();
  });

  test.skip('should handle AI assistant modal', async ({ page }) => {
    await page.goto('/reader/test-content');
    
    // Click AI button (assuming title attribute)
    await page.getByTitle('IA Assistente').click();
    
    // Verify panel opens
    await expect(page.getByText('Como posso ajudar?')).toBeVisible();
    
    // Close panel
    await page.getByRole('button', { name: /close/i }).click(); // Assuming close button exists or click outside
  });

  test.skip('should toggle dark/light mode if implemented', async ({ page }) => {
     await page.goto('/reader/test-content');
     // This depends on if there's a toggle. Assuming standard header.
     // If not present, we skip.
  });
});
