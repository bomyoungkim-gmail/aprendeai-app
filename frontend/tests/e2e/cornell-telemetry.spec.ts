import { test, expect } from '@playwright/test';

test.describe('Cornell Telemetry Integration - E2E', () => {
  const CONTENT_ID = 'test-content-id';

  test.beforeEach(async ({ page }) => {
    // 1. Mock Telemetry Batch Endpoint
    await page.route('**/telemetry/batch', async (route) => {
      const json = await route.request().postDataJSON();
      console.log('Telemetry Batch:', JSON.stringify(json, null, 2));
      await route.fulfill({ status: 200, body: JSON.stringify({ success: true, count: 1 }) });
    });

    // 2. Mock Auth
    await page.route('**/auth/login', async (route) => {
      await route.fulfill({
        status: 200,
        body: JSON.stringify({
          accessToken: 'fake-token',
          user: { id: 'user-123', email: 'test@example.com', name: 'Test User' }
        })
      });
    });

    await page.route('**/auth/profile', async (route) => {
        await route.fulfill({ status: 200, body: JSON.stringify({ id: 'user-123', plan: 'FREE' }) });
    });

    // 3. Mock Content
    await page.route(`**/cornell/contents/${CONTENT_ID}`, async (route) => {
       await route.fulfill({
         status: 200,
         body: JSON.stringify({
           id: CONTENT_ID,
           title: 'Test Integration Content',
           originalText: 'This is a sample text for testing telemetry integration. Select this text to create a highlight.',
           blocks: [],
           createdAt: new Date().toISOString()
         })
       });
    });

    // 4. Mock Context/Pedagogy
    await page.route(`**/cornell/contents/${CONTENT_ID}/context`, async (route) => {
        await route.fulfill({
            status: 200,
            body: JSON.stringify({
                pedagogicalData: {},
                suggestions: []
            })
        });
    });

     // 5. Mock Highlights List (Empty initially)
     await page.route(`**/cornell/contents/${CONTENT_ID}/highlights`, async (route) => {
        if (route.request().method() === 'POST') {
             await route.fulfill({ status: 201, body: JSON.stringify({ id: 'new-highlight-123' }) });
        } else {
             await route.fulfill({ status: 200, body: JSON.stringify([]) });
        }
    });

    // Login
    await page.goto('/login');
    // Assuming simple login bypass or auto-login if token present?
    // The previous test filled form.
    await page.fill('[name="email"]', 'test@example.com');
    await page.fill('[name="password"]', 'password');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/dashboard');
  });

  test('should emit HIGHLIGHT_CREATED event when creating a highlight', async ({ page }) => {
    await page.goto(`/reader/${CONTENT_ID}`);

    // Wait for content to load
    const contentArea = page.locator('p, article, [data-testid="content-display"] div').first();
    await expect(contentArea).toBeVisible({ timeout: 10000 });
    // Force text content if not present (mock might be raw)
    await contentArea.evaluate(node => node.textContent = "Text for selection testing.");

    // Select Text
    await contentArea.selectText();

    // Verify Menu appears
    const menu = page.getByTestId('text-selection-menu');
    await expect(menu).toBeVisible();

    // Setup Telemetry Waiter
    const telemetryPromise = page.waitForRequest(req => 
        req.url().includes('/telemetry/batch') &&
        req.postDataJSON().some((e: any) => e.eventType === 'HIGHLIGHT_CREATED' && e.data.type === 'EVIDENCE')
    );

    // Click "Evidência"
    await menu.getByLabel('Evidência').click();

    // Verify Modal
    const modal = page.locator('role=dialog'); // Or specific selector if available
    // Assuming simple flow: fill comment and save
    await page.getByPlaceholder('Adicione seu comentário...').fill('Test Evidence Telemetry');
    
    // Check if 'SALVAR' button exists
    await page.getByText('SALVAR').click();

    // Verify Telemetry
    const request = await telemetryPromise;
    const events = request.postDataJSON();
    const event = events.find((e: any) => e.eventType === 'HIGHLIGHT_CREATED');
    
    expect(event).toBeDefined();
    expect(event.sessionId).toBeDefined(); // Should be from localStorage
    expect(event.data.type).toBe('EVIDENCE');
    expect(event.data.commentText).toBe('Test Evidence Telemetry');
  });

  test('should emit NOTE_CREATED event when creating a synthesis note', async ({ page }) => {
    await page.goto(`/reader/${CONTENT_ID}`);
    
    // Click Synthesis Tab -> Use Title which works in both collapsed/expanded modes
    await page.getByTitle('Síntese').click();

    // Check if we need to click "Adicionar" to show form
    // The "Adicionar" button is present in the empty state or header
    const addBtn = page.getByRole('button', { name: 'Adicionar' });
    if (await addBtn.isVisible()) {
        await addBtn.click();
    }

    // Find textarea
    // Try generic textarea selector
    const textarea = page.locator('textarea').first();
    await expect(textarea).toBeVisible();

    // Fill synthesis
    const synthesisText = 'This is a synthesis summary for testing telemetry.';
    await textarea.fill(synthesisText);

    // Setup Telemetry Waiter
    const telemetryPromise = page.waitForRequest(req => 
        req.url().includes('/telemetry/batch') &&
        req.postDataJSON().some((e: any) => e.eventType === 'NOTE_CREATED' && e.data.type === 'SYNTHESIS')
    );

    // Find Submit buttons commonly used
    // It might be "Salvar", "Confirmar", generic check icon, or "Adicionar" again?
    // In CreateHighlightModal it was "SALVAR".
    // Let's try finding a button with text "Salvar" or "Criar" or "✔"
    const saveBtn = page.locator('button').filter({ hasText: /Salvar|Criar|Adicionar|Concluir/i }).first();
    
    if (await saveBtn.isVisible()) {
        await saveBtn.click();
    } else {
        // Fallback: Press Enter (if it's a small input)
        await textarea.press('Enter');
    }

    // Verify Telemetry
    const request = await telemetryPromise;
    const events = request.postDataJSON();
    const event = events.find((e: any) => e.eventType === 'NOTE_CREATED');
    
    expect(event).toBeDefined();
    expect(event.sessionId).toBeDefined();
    expect(event.data.type).toBe('SYNTHESIS');
    expect(event.data.text).toBe(synthesisText);
  });
});
