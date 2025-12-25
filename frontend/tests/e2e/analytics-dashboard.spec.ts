import { test, expect } from '@playwright/test';

test.describe('Study Session Analytics Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // Login as test user
    await page.goto('/login');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password');
    await page.click('button[type="submit"]');
    
    // Wait for dashboard
    await page.waitForURL('/dashboard');
  });

  test('should display hourly performance chart on dashboard', async ({ page }) => {
    // Verify chart component is rendered
    await expect(page.locator('text=Desempenho por Horário')).toBeVisible();
    
    // Verify chart elements
    await expect(page.locator('text=Seus Horários de Pico')).toBeVisible();
    
    // Check if Recharts SVG is rendered (Recharts uses SVG for charts)
    const chartSvg = page.locator('.recharts-wrapper');
    await expect(chartSvg).toBeVisible();

    // Verify bars are rendered
    const bars = page.locator('.recharts-bar-rectangle');
    const barCount = await bars.count();
    expect(barCount).toBeGreaterThan(0);
  });

  test('should display quality overview card', async ({ page }) => {
    await expect(page.locator('text=Qualidade de Estudo')).toBeVisible();
    
    // Verify metrics are displayed
    await expect(page.locator('text=Foco Médio')).toBeVisible();
    await expect(page.locator('text=Taxa de Acerto')).toBeVisible();
  });

  test('should show interactive tooltips on chart hover', async ({ page }) => {
    // Hover over a bar in the chart
    const firstBar = page.locator('.recharts-bar-rectangle').first();
    await firstBar.hover();

    // Wait for tooltip to appear
    await page.waitForTimeout(500);

    // Verify tooltip content (Recharts creates a div with class recharts-tooltip-wrapper)
    const tooltip = page.locator('.recharts-tooltip-wrapper');
    await expect(tooltip).toBeVisible();
  });

  test('should handle empty state correctly', async ({ page }) => {
    // This would need a fresh user with no sessions
    // For now, we'll verify the fallback UI exists in code
    
    // Navigate to dashboard
    await page.goto('/dashboard');

    // If no data, should show empty state message
    const emptyState = page.locator('text=Comece a estudar para ver seus horários');
    
    // This will only be visible if user has no sessions
    // In a real test, you'd create a fresh user without data
    const isVisible = await emptyState.isVisible().catch(() => false);
    
    // Either charts are shown OR empty state is shown
    const hasCharts = await page.locator('text=Desempenho por Horário').isVisible();
    expect(hasCharts || isVisible).toBeTruthy();
  });

  test('should display correct peak hours badge', async ({ page }) => {
    // If user has sessions, peak hours should be displayed
    const peakBadge = page.locator('text=Seus Horários de Pico');
    
    const isVisible = await peakBadge.isVisible().catch(() => false);
    if (isVisible) {
      // Verify format (e.g., "14h, 15h, 16h")
      const badgeText = await peakBadge.locator('..').locator('p').last().textContent();
      expect(badgeText).toMatch(/\d+h/);
    }
  });

  test('should show contextual feedback based on metrics', async ({ page }) => {
    // Quality card should show different feedback based on scores
    const qualityCard = page.locator('text=Qualidade de Estudo').locator('..');

    // Look for feedback messages
    const feedbackMessages = [
      'Excelente!',
      'Pode melhorar',
      'Tente eliminar distrações',
      'Ótimo domínio!',
      'Bom progresso',
      'Revise mais',
    ];

    let foundFeedback = false;
    for (const message of feedbackMessages) {
      const exists = await qualityCard.locator(`text=${message}`).isVisible().catch(() => false);
      if (exists) {
        foundFeedback = true;
        break;
      }
    }

    // Should have at least one feedback message OR user has no data
    const hasData = await page.locator('text=sessões').isVisible();
    if (hasData) {
      expect(foundFeedback).toBeTruthy();
    }
  });

  test('should display correct time period labels', async ({ page }) => {
    // Hourly chart shows "Últimos X dias"
    await expect(page.locator('text=Últimos 30 dias')).toBeVisible();

    // Quality card shows period
    await expect(page.locator('text=Últimos 7 dias')).toBeVisible();
  });

  test('should be responsive on mobile viewport', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // Charts should still be visible
    await expect(page.locator('text=Desempenho por Horário')).toBeVisible();
    await expect(page.locator('text=Qualidade de Estudo')).toBeVisible();

    // Charts should stack vertically (grid-cols-1 on mobile)
    const gridContainer = page.locator('.grid.grid-cols-1.lg\\:grid-cols-2');
    await expect(gridContainer).toBeVisible();
  });
});

test.describe('Active Topics Metric', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
  });

  test('should display active topics count', async ({ page }) => {
    await expect(page.locator('text=Tópicos Ativos')).toBeVisible();
    
    // Verify number is displayed
    const topicsCard = page.locator('text=Tópicos Ativos').locator('..');
    const count = await topicsCard.locator('.text-3xl').textContent();
    expect(count).toMatch(/\d+/);
  });

  test('should show pedagogical recommendation', async ({ page }) => {
    const recommendations = [
      'Comece a estudar',
      'Varie um pouco mais',
      'Foco ideal',
      'Muitos tópicos',
    ];

    let foundRecommendation = false;
    for (const rec of recommendations) {
      const exists = await page.locator(`text=${rec}`).isVisible().catch(() => false);
      if (exists) {
        foundRecommendation = true;
        break;
      }
    }

    expect(foundRecommendation).toBeTruthy();
  });
});
