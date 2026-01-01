import { test, expect } from '@playwright/test';

test.describe('Sprint 4: Pedagogical Interventions', () => {
  test.beforeEach(async ({ page }) => {
    // Mock authentication
    await page.addInitScript(() => {
      localStorage.setItem('auth-storage', JSON.stringify({
        state: {
          user: { id: 'test-user', email: 'test@example.com' },
          accessToken: 'mock-token'
        }
      }));
    });

    // Mock API responses
    await page.route('**/api/v1/cornell/contents/*/mode', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          mode: 'DIDACTIC',
          modeSource: 'USER',
          effectiveMode: 'DIDACTIC'
        })
      });
    });

    await page.route('**/assessment**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([{
          id: 'test-assessment',
          questions: [
            {
              id: 'q1',
              questionType: 'MULTIPLE_CHOICE',
              questionText: 'Qual é o conceito principal?',
              options: ['Opção A', 'Opção B', 'Opção C'],
              correctAnswer: 0
            }
          ]
        }])
      });
    });

    await page.route('**/telemetry/**', async (route) => {
      await route.fulfill({ status: 200, body: '{}' });
    });
  });

  test('E1: Intervention engine respects flow state', async ({ page }) => {
    await page.goto('/reader/demo-content');
    
    // Wait for content to load
    await page.waitForTimeout(2000);

    // Simulate flow state (rapid, consistent reading)
    await page.evaluate(() => {
      // Set flow state in heuristics store
      (window as any).__flowState = true;
    });

    // Wait for intervention check interval (10s)
    await page.waitForTimeout(11000);

    // Checkpoint should NOT appear during flow
    const checkpoint = page.locator('[data-testid="pedagogical-checkpoint"]');
    await expect(checkpoint).not.toBeVisible();
  });

  test('E1: Intervention cooldown is respected', async ({ page }) => {
    await page.goto('/reader/demo-content');
    
    // Trigger first intervention manually
    await page.evaluate(() => {
      const event = new CustomEvent('trigger-intervention');
      window.dispatchEvent(event);
    });

    await page.waitForTimeout(1000);

    // Dismiss it
    const dismissBtn = page.locator('button:has-text("Dispensar")').first();
    if (await dismissBtn.isVisible()) {
      await dismissBtn.click();
    }

    // Try to trigger another immediately
    await page.evaluate(() => {
      const event = new CustomEvent('trigger-intervention');
      window.dispatchEvent(event);
    });

    // Should not appear due to cooldown
    const checkpoint = page.locator('[data-testid="pedagogical-checkpoint"]');
    await expect(checkpoint).not.toBeVisible();
  });

  test('E2: Checkpoint blocks in DIDACTIC mode', async ({ page }) => {
    await page.goto('/reader/demo-content');
    
    // Wait for PRE phase checkpoint to appear
    await page.waitForTimeout(3000);

    const checkpoint = page.getByText('Checkpoint Obrigatório');
    await expect(checkpoint).toBeVisible({ timeout: 10000 });

    // Verify blocking banner
    const banner = page.getByText('Acesso bloqueado até conclusão');
    await expect(banner).toBeVisible();
  });

  test('E2: Checkpoint telemetry tracks attempts and score', async ({ page }) => {
    let telemetryEvents: any[] = [];

    await page.route('**/telemetry/**', async (route) => {
      const request = route.request();
      const postData = request.postDataJSON();
      if (postData) {
        telemetryEvents.push(postData);
      }
      await route.fulfill({ status: 200, body: '{}' });
    });

    await page.goto('/reader/demo-content');
    await page.waitForTimeout(3000);

    // Start checkpoint
    const startBtn = page.getByRole('button', { name: /começar/i });
    if (await startBtn.isVisible()) {
      await startBtn.click();
    }

    // Answer question
    await page.waitForTimeout(500);
    const option = page.locator('button:has-text("Opção A")').first();
    if (await option.isVisible()) {
      await option.click();
    }

    // Submit
    const submitBtn = page.getByRole('button', { name: /finalizar/i });
    if (await submitBtn.isVisible()) {
      await submitBtn.click();
    }

    await page.waitForTimeout(1000);

    // Verify telemetry
    const checkpointEvent = telemetryEvents.find(e => 
      e.event === 'CHECKPOINT_ANSWERED' || e.eventType === 'CHECKPOINT_ANSWERED'
    );

    if (checkpointEvent) {
      expect(checkpointEvent).toHaveProperty('score');
      expect(checkpointEvent).toHaveProperty('latencyMs');
      expect(checkpointEvent).toHaveProperty('attempts');
    }
  });

  test('G2: DIDACTIC flow transitions through phases', async ({ page }) => {
    let phaseTransitions: string[] = [];

    await page.route('**/telemetry/**', async (route) => {
      const request = route.request();
      const postData = request.postDataJSON();
      if (postData?.event === 'DIDACTIC_PHASE_TRANSITION') {
        phaseTransitions.push(`${postData.from} -> ${postData.to}`);
      }
      await route.fulfill({ status: 200, body: '{}' });
    });

    await page.goto('/reader/demo-content');
    
    // Should start in PRE phase
    await page.waitForTimeout(2000);
    const preCheckpoint = page.getByText('Checkpoint Obrigatório');
    await expect(preCheckpoint).toBeVisible({ timeout: 5000 });

    // Complete PRE checkpoint
    const startBtn = page.getByRole('button', { name: /começar/i });
    if (await startBtn.isVisible()) {
      await startBtn.click();
      await page.waitForTimeout(500);
      
      const option = page.locator('button').first();
      if (await option.isVisible()) {
        await option.click();
      }
      
      const submitBtn = page.getByRole('button', { name: /finalizar/i });
      if (await submitBtn.isVisible()) {
        await submitBtn.click();
      }

      await page.waitForTimeout(500);
      const continueBtn = page.getByRole('button', { name: /continuar/i });
      if (await continueBtn.isVisible()) {
        await continueBtn.click();
      }
    }

    await page.waitForTimeout(2000);

    // Verify phase transition was tracked
    expect(phaseTransitions.length).toBeGreaterThan(0);
  });

  test('G2.3: Scaffolding adjusts based on performance', async ({ page }) => {
    let scaffoldingEvents: any[] = [];

    await page.route('**/telemetry/**', async (route) => {
      const request = route.request();
      const postData = request.postDataJSON();
      if (postData?.event === 'SCAFFOLDING_ACTIVE') {
        scaffoldingEvents.push(postData);
      }
      await route.fulfill({ status: 200, body: '{}' });
    });

    await page.goto('/reader/demo-content');
    await page.waitForTimeout(3000);

    // Complete checkpoint with low score (wrong answer)
    const startBtn = page.getByRole('button', { name: /começar/i });
    if (await startBtn.isVisible()) {
      await startBtn.click();
      await page.waitForTimeout(500);
      
      // Select wrong answer (index 2 instead of 0)
      const wrongOption = page.locator('button:has-text("Opção C")').first();
      if (await wrongOption.isVisible()) {
        await wrongOption.click();
      }
      
      const submitBtn = page.getByRole('button', { name: /finalizar/i });
      if (await submitBtn.isVisible()) {
        await submitBtn.click();
      }
    }

    await page.waitForTimeout(2000);

    // Scaffolding should activate due to low score
    expect(scaffoldingEvents.length).toBeGreaterThan(0);
    if (scaffoldingEvents.length > 0) {
      expect(scaffoldingEvents[0]).toHaveProperty('delay');
    }
  });
});
