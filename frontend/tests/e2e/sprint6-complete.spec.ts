/**
 * Sprint 6 E2E Tests
 * 
 * Following MelhoresPraticas.txt:
 * - Testes E2E com Playwright
 * - Cobertura completa de features
 * - Assertions claras
 * 
 * Tests:
 * - I2.1-I2.2: Offline sync
 * - I3.1-I3.3: Accessibility
 * - Analytics dashboard
 * - G5.3: SCIENTIFIC glossary
 * - G5.4: Section annotations
 */

import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  // Mock Auth
  await page.route('**/auth/login', async (route) => {
    await route.fulfill({
      status: 200,
      body: JSON.stringify({
        access_token: 'fake-jwt',
        user: { id: 'user-1', email: 'test@example.com' }
      })
    });
  });

  // Mock Content - Generic test article
  await page.route('**/api/v1/contents/test-article', async (route) => {
    await route.fulfill({
      status: 200,
      body: JSON.stringify({
        id: 'test-article',
        title: 'Test Article',
        contentType: 'PDF',
        contentMode: 'NARRATIVE',
        text: 'This is a test article with important paragraph and some test content.'
      })
    });
  });

  // Mock Content - Scientific article
  await page.route('**/api/v1/contents/scientific-article*', async (route) => {
    await route.fulfill({
      status: 200,
      body: JSON.stringify({
        id: 'scientific-article',
        title: 'Scientific Research',
        contentType: 'ARTICLE',
        contentMode: 'SCIENTIFIC',
        text: 'Abstract\nAbstract content goes here.\n\nIntroduction\nThe mitochondria is the powerhouse of the cell. Photosynthesis is the process by which plants convert light energy. The enzyme catalyzes the reaction.\n\nMethods\nMethods content and results.'
      })
    });
  });

  // Mock Content Mode
  await page.route('**/api/v1/content-mode/*', async (route) => {
    const url = route.request().url();
    const mode = url.includes('scientific-article') ? 'SCIENTIFIC' : 'NARRATIVE';
    await route.fulfill({
      status: 200,
      body: JSON.stringify({
        mode: mode,
        effectiveMode: mode,
        source: 'USER'
      })
    });
  });

  // Mock Unified Stream
  await page.route('**/api/v1/contents/*/cornell', async (route) => {
    await route.fulfill({
      status: 200,
      body: JSON.stringify({
        id: 'cornell-1',
        contentId: 'scientific-article',
        summary_text: 'Summary',
        notes_json: [],
        cues_json: []
      })
    });
  });

  await page.route('**/api/v1/contents/*/highlights', async (route) => {
    await route.fulfill({
      status: 200,
      body: JSON.stringify([])
    });
  });

  // Mock Glossary
  await page.route('**/api/v1/glossary/define*', async (route) => {
    const url = new URL(route.request().url());
    const term = url.searchParams.get('term');
    await route.fulfill({
      status: 200,
      body: JSON.stringify({
        term: term,
        definition: `Definition of ${term}`,
        source: 'Webster'
      })
    });
  });

  // Mock Analytics
  await page.route('**/api/v1/analytics/stats*', async (route) => {
    await route.fulfill({
      status: 200,
      body: JSON.stringify({
        activeUsers: 1250,
        contentsRead: 4500,
        completionRate: 75,
        avgTime: 12,
        modeUsage: {
          NARRATIVE: 400,
          SCIENTIFIC: 150,
          DIDACTIC: 300
        },
        confusionHeatmap: [
          { sectionId: 'abstract', count: 2 },
          { sectionId: 'methods', count: 12 },
          { sectionId: 'results', count: 5 },
          { sectionId: 'discussion', count: 8 }
        ]
      })
    });
  });

  await page.goto('/');
});

test.describe('Sprint 6: Offline & Accessibility', () => {

  test('I2.1: Should save annotation offline when network is down', async ({ page, context }) => {
    // Load content
    await page.goto('/reader/test-article');
    await page.waitForLoadState('networkidle');

    // Go offline
    await context.setOffline(true);

    // Create annotation
    await page.getByText('important paragraph').first().click();
    await page.getByRole('button', { name: 'Add Note' }).click();
    await page.getByPlaceholder('Add your note').fill('Offline annotation test');
    await page.getByRole('button', { name: 'Save' }).click();

    // Verify offline indicator appears
    await expect(page.getByText(/offline/i)).toBeVisible();
    await expect(page.getByText(/1 item pendente/i)).toBeVisible();

    // Verify annotation saved locally
    const annotations = await page.evaluate(() => {
      return localStorage.getItem('cornell-annotations');
    });
    expect(annotations).toContain('Offline annotation test');
  });

  test('I2.2: Should auto-sync when coming back online', async ({ page, context }) => {
    // Setup offline annotation
    await context.setOffline(true);
    await page.goto('/reader/test-article');
    
    await page.getByText('test content').first().click();
    await page.getByRole('button', { name: 'Add Note' }).click();
    await page.getByPlaceholder('Add your note').fill('Auto-sync test');
    await page.getByRole('button', { name: 'Save' }).click();

    // Verify pending count
    await expect(page.getByText(/1 item pendente/i)).toBeVisible();

    // Go back online
    await context.setOffline(false);

    // Wait for auto-sync
    await expect(page.getByText(/sincronizado/i)).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(/0 item/i)).toBeVisible();
  });

  test('I3.1: Should adjust font size with controls', async ({ page }) => {
    // Open accessibility controls
    await page.goto('/settings/accessibility');
    
    // Get initial font size
    const initialSize = await page.evaluate(() => {
      return getComputedStyle(document.documentElement).getPropertyValue('--base-font-size');
    });

    // Increase font size
    await page.getByLabel('Tamanho da fonte').fill('20');
    
    // Verify font size changed
    const newSize = await page.evaluate(() => {
      return getComputedStyle(document.documentElement).getPropertyValue('--base-font-size');
    });
    expect(newSize).toBe('20px');
    expect(newSize).not.toBe(initialSize);
  });

  test('I3.1: Should adjust font size with keyboard shortcuts', async ({ page }) => {
    await page.goto('/reader/test-article');

    // Get initial size
    const initialSize = await page.evaluate(() => {
      return getComputedStyle(document.documentElement).getPropertyValue('--base-font-size');
    });

    // Increase with Ctrl+Plus
    await page.keyboard.press('Control+=');
    await page.waitForTimeout(100);

    const increasedSize = await page.evaluate(() => {
      return getComputedStyle(document.documentElement).getPropertyValue('--base-font-size');
    });
    expect(parseInt(increasedSize)).toBeGreaterThan(parseInt(initialSize));

    // Decrease with Ctrl+Minus
    await page.keyboard.press('Control+-');
    await page.waitForTimeout(100);

    const decreasedSize = await page.evaluate(() => {
      return getComputedStyle(document.documentElement).getPropertyValue('--base-font-size');
    });
    expect(parseInt(decreasedSize)).toBeLessThan(parseInt(increasedSize));
  });

  test('I3.2: Should toggle contrast modes', async ({ page }) => {
    await page.goto('/settings/accessibility');

    // Test high contrast
    await page.getByRole('radio', { name: /alto/i }).click();
    const highContrast = await page.evaluate(() => {
      return document.documentElement.getAttribute('data-contrast');
    });
    expect(highContrast).toBe('high');

    // Test normal contrast
    await page.getByRole('radio', { name: /normal/i }).click();
    const normalContrast = await page.evaluate(() => {
      return document.documentElement.getAttribute('data-contrast');
    });
    expect(normalContrast).toBe('normal');
  });

  test('I3.3: Should enable focus mode', async ({ page }) => {
    await page.goto('/settings/accessibility');

    // Enable focus mode
    await page.getByRole('switch', { name: /modo foco/i }).click();

    // Verify focus mode applied
    const focusMode = await page.evaluate(() => {
      return document.documentElement.getAttribute('data-focus-mode');
    });
    expect(focusMode).toBe('true');

    // Verify toast notification
    await expect(page.getByText(/modo foco ativado/i)).toBeVisible();
  });

  test('I3.3: Should enable reduced motion', async ({ page }) => {
    await page.goto('/settings/accessibility');

    // Enable reduced motion
    await page.getByRole('switch', { name: /reduzir animações/i }).click();

    // Verify animation duration set to 0
    const animDuration = await page.evaluate(() => {
      return getComputedStyle(document.documentElement).getPropertyValue('--animation-duration');
    });
    expect(animDuration).toBe('0ms');
  });

  test('Should persist accessibility settings', async ({ page }) => {
    await page.goto('/settings/accessibility');

    // Change settings
    await page.getByLabel('Tamanho da fonte').fill('18');
    await page.getByRole('radio', { name: /alto/i }).click();
    await page.getByRole('switch', { name: /modo foco/i }).click();

    // Reload page
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Verify settings persisted
    const fontSize = await page.evaluate(() => {
      return getComputedStyle(document.documentElement).getPropertyValue('--base-font-size');
    });
    expect(fontSize).toBe('18px');

    const contrast = await page.evaluate(() => {
      return document.documentElement.getAttribute('data-contrast');
    });
    expect(contrast).toBe('high');

    const focusMode = await page.evaluate(() => {
      return document.documentElement.getAttribute('data-focus-mode');
    });
    expect(focusMode).toBe('true');
  });
});

test.describe('Sprint 6: Analytics Dashboard', () => {
  test('Should display analytics dashboard with KPIs', async ({ page }) => {
    await page.goto('/analytics');

    // Verify KPI cards
    await expect(page.getByText('Usuários Ativos')).toBeVisible();
    await expect(page.getByText('Conteúdos Lidos')).toBeVisible();
    await expect(page.getByText('Taxa de Conclusão')).toBeVisible();
    await expect(page.getByText('Tempo Médio')).toBeVisible();

    // Verify charts
    await expect(page.getByText('Uso por Modo')).toBeVisible();
    await expect(page.getByText('Heatmap de Confusão')).toBeVisible();
  });

  test('Should filter analytics by date range', async ({ page }) => {
    await page.goto('/analytics');

    // Change to 7 days
    await page.getByRole('button', { name: '7 dias' }).click();
    await page.waitForLoadState('networkidle');

    // Verify data updated (would check actual values in real test)
    await expect(page.getByText('Usuários Ativos')).toBeVisible();

    // Change to 90 days
    await page.getByRole('button', { name: '90 dias' }).click();
    await page.waitForLoadState('networkidle');
    await expect(page.getByText('Usuários Ativos')).toBeVisible();
  });

  test('Should export analytics to CSV', async ({ page }) => {
    await page.goto('/analytics');

    // Setup download listener
    const downloadPromise = page.waitForEvent('download');

    // Click CSV export
    await page.getByRole('button', { name: /CSV/i }).click();

    // Verify download
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe('analytics-export.csv');
  });

  test('Should display confusion heatmap with color coding', async ({ page }) => {
    await page.goto('/analytics');

    // Verify heatmap exists
    await expect(page.getByText('Heatmap de Confusão')).toBeVisible();

    // Verify color-coded sections (would need test data)
    const heatmapItems = page.locator('[class*="bg-red-"], [class*="bg-yellow-"], [class*="bg-green-"]');
    await expect(heatmapItems.first()).toBeVisible();
  });
});

test.describe('Sprint 6: SCIENTIFIC Mode Features', () => {
  test('G5.3: Should display glossary popover on term click', async ({ page }) => {
    await page.goto('/reader/scientific-article?mode=SCIENTIFIC');

    // Click on a scientific term
    await page.getByText('mitochondria').click();

    // Verify popover appears
    await expect(page.getByRole('heading', { name: 'mitochondria' })).toBeVisible();
    await expect(page.getByText(/fonte:/i)).toBeVisible();
  });

  test('G5.3: Should show loading state while fetching definition', async ({ page }) => {
    await page.goto('/reader/scientific-article?mode=SCIENTIFIC');

    // Click term
    await page.getByText('photosynthesis').click();

    // Verify loading state
    await expect(page.locator('.animate-pulse')).toBeVisible();

    // Wait for definition
    await expect(page.getByText(/fonte:/i)).toBeVisible({ timeout: 5000 });
  });

  test('G5.3: Should close glossary popover', async ({ page }) => {
    await page.goto('/reader/scientific-article?mode=SCIENTIFIC');

    // Open popover
    await page.getByText('enzyme').click();
    await expect(page.getByRole('heading', { name: 'enzyme' })).toBeVisible();

    // Close popover
    await page.getByLabel('Fechar').click();
    await expect(page.getByRole('heading', { name: 'enzyme' })).not.toBeVisible();
  });

  test('G5.4: Should filter annotations by IMRaD section', async ({ page }) => {
    await page.goto('/reader/scientific-article?mode=SCIENTIFIC');

    // Create annotations in different sections
    await page.getByText('Abstract content').click();
    await page.getByRole('button', { name: 'Add Note' }).click();
    await page.getByPlaceholder('Add your note').fill('Abstract note');
    await page.getByRole('button', { name: 'Save' }).click();

    await page.getByText('Methods content').click();
    await page.getByRole('button', { name: 'Add Note' }).click();
    await page.getByPlaceholder('Add your note').fill('Methods note');
    await page.getByRole('button', { name: 'Save' }).click();

    // Open annotations panel
    await page.getByRole('button', { name: /annotations/i }).click();

    // Verify all annotations visible
    await expect(page.getByText('Abstract note')).toBeVisible();
    await expect(page.getByText('Methods note')).toBeVisible();

    // Filter by Abstract section
    await page.getByRole('button', { name: /abstract/i }).click();
    await expect(page.getByText('Abstract note')).toBeVisible();
    await expect(page.getByText('Methods note')).not.toBeVisible();

    // Filter by Methods section
    await page.getByRole('button', { name: /methods/i }).click();
    await expect(page.getByText('Methods note')).toBeVisible();
    await expect(page.getByText('Abstract note')).not.toBeVisible();
  });

  test('G5.4: Should show annotation count per section', async ({ page }) => {
    await page.goto('/reader/scientific-article?mode=SCIENTIFIC');

    // Open annotations panel
    await page.getByRole('button', { name: /annotations/i }).click();

    // Verify section counts (would need test data)
    await expect(page.getByText(/abstract/i)).toBeVisible();
    await expect(page.getByText(/\d+/)).toBeVisible(); // Count badge
  });
});

test.describe('Sprint 6: Integration Tests', () => {
  test('Should work offline with accessibility settings', async ({ page, context }) => {
    // Set accessibility settings
    await page.goto('/settings/accessibility');
    await page.getByLabel('Tamanho da fonte').fill('20');
    await page.getByRole('switch', { name: /modo foco/i }).click();

    // Go offline
    await context.setOffline(true);

    // Navigate to content
    await page.goto('/reader/test-article');

    // Verify accessibility settings still applied
    const fontSize = await page.evaluate(() => {
      return getComputedStyle(document.documentElement).getPropertyValue('--base-font-size');
    });
    expect(fontSize).toBe('20px');
  });

  test('Should sync offline annotations after accessibility changes', async ({ page, context }) => {
    // Create offline annotation
    await context.setOffline(true);
    await page.goto('/reader/test-article');
    await page.getByText('test').first().click();
    await page.getByRole('button', { name: 'Add Note' }).click();
    await page.getByPlaceholder('Add your note').fill('Offline note');
    await page.getByRole('button', { name: 'Save' }).click();

    // Change accessibility settings while offline
    await page.goto('/settings/accessibility');
    await page.getByLabel('Tamanho da fonte').fill('18');

    // Go online
    await context.setOffline(false);

    // Verify sync happens
    await expect(page.getByText(/sincronizado/i)).toBeVisible({ timeout: 10000 });
  });
});
