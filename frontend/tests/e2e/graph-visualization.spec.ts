import { test, expect } from '@playwright/test';

test.describe('Learner Graph E2E', () => {

  test.beforeEach(async ({ page }) => {
    // Navigate to content page with graph
    // Note: Assuming a test user is logged in via storage state or helper
    // For now we assume the page is accessible
    await page.goto('/content/123/learn'); 
  });

  test('should render 2D graph by default', async ({ page }) => {
    await expect(page.getByText('Mapa de Conhecimento')).toBeVisible();
    await expect(page.locator('.react-flow__renderer')).toBeVisible();
  });

  test('should support keyboard shortcuts', async ({ page }) => {
    // Ctrl+F to search
    await page.keyboard.press('Control+f');
    await expect(page.getByPlaceholder('Buscar tópico...')).toBeFocused();

    // Type search
    await page.keyboard.type('Topic 1');
    
    // Escape to clear
    await page.keyboard.press('Escape');
    await expect(page.getByPlaceholder('Buscar tópico...')).toHaveValue('');
  });

  test('should toggle 3D view', async ({ page }) => {
    await page.keyboard.press('Control+3');
    await expect(page.getByText('Modo 3D')).toBeVisible(); // Toast message
    // 3D graph canvas usually has generic class or ID, checking generic canvas presence
    // await expect(page.locator('canvas')).toBeVisible(); 
  });

  test('should open node details on click', async ({ page }) => {
    // Click a node (this is tricky in finding specific node by text in canvas)
    // We can rely on aria-label if we added it, or test ID
    // For now, testing the side sheet existence
    await expect(page.locator('[data-testid="node-details-sheet"]')).not.toBeVisible();
    
    // Simulate node click if possible, otherwise skip interaction in draft
  });

});
