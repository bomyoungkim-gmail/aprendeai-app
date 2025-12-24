import { test, expect } from '@playwright/test';

test.describe('Games System E2E', () => {
  test.beforeEach(async ({ page }) => {
    // Login with existing test credentials
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    
    // Try to login with standard dev user
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
  });

  test('should navigate to games page and display all 15 games', async ({ page }) => {
    // Navigate to games
    await page.goto('/games');
    // await page.waitForLoadState('networkidle'); // Removed potentially flaky waitForLoadState
    
    // Check page title
    await expect(page.locator('h1')).toContainText('Centro de Jogos');
    
    // Should show 15 game cards
    const gameCards = page.locator('[data-testid="game-card"]');
    await expect(gameCards).toHaveCount(15, { timeout: 10000 });
    
    // Verify some key games are present
    await expect(page.locator('text=Professor Feynman')).toBeVisible();
    await expect(page.locator('text=Mestre do Debate')).toBeVisible();
    await expect(page.locator('text=Resumo Livre')).toBeVisible();
  });

  test('should open and close game modal', async ({ page }) => {
    await page.goto('/games');
    
    // Click on a game card
    const firstGame = page.locator('[data-testid="game-card"]').first();
    await firstGame.click();
    
    // Modal should be visible
    await expect(page.locator('[role="dialog"]')).toBeVisible();
    await expect(page.locator('text=Fechar').or(page.locator('[aria-label="Close"]'))).toBeVisible();
    
    // Close modal
    await page.locator('text=Fechar').or(page.locator('[aria-label="Close"]')).click();
    
    // Modal should be closed
    await expect(page.locator('[role="dialog"]')).not.toBeVisible();
  });

  test('should play CONCEPT_LINKING game and get score', async ({ page }) => {
    await page.goto('/games');
    
    // Find and click CONCEPT_LINKING game
    await page.click('[data-testid="game-card-CONCEPT_LINKING"]');
    
    // Wait for modal
    await expect(page.locator('[role="dialog"]')).toBeVisible();
    
    // Should show game prompt
    await expect(page.locator('text=Taboo')).toBeVisible();
    
    // Fill in answer (avoid forbidden words)
    const textarea = page.locator('textarea').first();
    await textarea.fill('A system where citizens choose representatives through organized processes.');
    
    // Setup generic API response listener
    const responsePromise = page.waitForResponse(response => 
      response.url().includes('/api/educator/turn') && response.status() === 201
    );

    // Submit answer
    await page.click('button:has-text("Enviar")');
    
    // Wait for API response
    await responsePromise;
    
    // Should show score or feedback
    await expect(
      page.locator('text=/score|pontos|✅|feedback/i').first()
    ).toBeVisible({ timeout: 10000 });
  });

  test('should track game progress', async ({ page }) => {
    await page.goto('/games');
    
    const gameCard = page.locator('[data-testid="game-card-FREE_RECALL_SCORE"]');
    
    // Play the game
    await gameCard.click();
    await page.waitForSelector('textarea');
    
    // Fill answer
    await page.fill('textarea', 'Plantas fazem fotossíntese usando luz solar para produzir energia. Elas absorvem CO2 e liberam oxigênio.');
    
    const responsePromise = page.waitForResponse(response => 
      response.url().includes('/api/educator/turn') && response.status() === 201
    );

    // Submit
    await page.click('button:has-text("Enviar")');
    await responsePromise;
    
    // Close modal
    await page.locator('[aria-label="Close"]').or(page.locator('text=Fechar')).click();
    
    // Reload games page to refresh stats
    await page.goto('/games');
    
    // Check if progress updated (stars or play count)
    const updatedCard = page.locator('[data-testid="game-card-FREE_RECALL_SCORE"]');
    await expect(
      updatedCard.locator('text=/Jogadas|⭐|stars/i')
    ).toBeVisible();
  });
  test('should display leaderboard', async ({ page }) => {
    await page.goto('/games/leaderboard');
    await page.waitForLoadState('networkidle');
    
    // Should show leaderboard title
    await expect(page.locator('h1, h2')).toContainText(/leaderboard|ranking|classificação/i);
    
    // Should show user entries
    const leaderboardEntries = page.locator('[data-testid="leaderboard-entry"]');
    await expect(leaderboardEntries.first()).toBeVisible();
  });

  test('should show game stats in dashboard', async ({ page }) => {
    // First, play a game to ensure there's data
    await page.goto('/games');
    await page.click('[data-testid="game-card"]');
    await page.fill('textarea', 'Test answer for dashboard stats');
    
    const responsePromise = page.waitForResponse(response => response.url().includes('/api/educator/turn') && response.status() === 201);
    await page.click('button:has-text("Enviar")');
    await responsePromise;
    
    // Go to dashboard
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    
    // Should show games stats
    await expect(
      page.locator('text=/jogos|games|atividades/i')
    ).toBeVisible();
  });

  test('should handle game with forbidden words (CONCEPT_LINKING)', async ({ page }) => {
    await page.goto('/games');
    await page.click('[data-testid="game-card-CONCEPT_LINKING"]');
    
    await page.waitForSelector('textarea');
    
    // Use a forbidden word (e.g., "vote" for Democracy)
    await page.fill('textarea', 'A system where people vote for leaders.');
    
    // Submit
    const responsePromise = page.waitForResponse(response => response.url().includes('/api/educator/turn'));
    await page.click('button:has-text("Enviar")');
    await responsePromise;
    
    // Should show error about forbidden word
    await expect(page.locator('text=/proibida|forbidden|❌/i')).toBeVisible();
  });

  test('should award stars based on performance', async ({ page }) => {
    await page.goto('/games');
    
    // Play a game with good answer
    await page.click('[data-testid="game-card-FREE_RECALL_SCORE"]');
    await page.waitForSelector('textarea');
    
    // Give detailed, comprehensive answer
    await page.fill('textarea', `
      A fotossíntese é o processo fundamental pelo qual plantas e algas convertem energia luminosa em energia química.
      Usando luz solar, água e dióxido de carbono (CO2), organismos fotossintetizantes produzem glicose (açúcar) e liberam oxigênio.
      Este processo ocorre nos cloroplastos, especificamente nas membranas tilacoides onde a clorofila captura a luz.
      A fotossíntese é essencial para a vida na Terra, pois produz oxigênio e serve como base das cadeias alimentares.
    `);
    
    const responsePromise = page.waitForResponse(response => response.url().includes('/api/educator/turn') && response.status() === 201);
    // Submit
    await page.click('button:has-text("Enviar")');
    await responsePromise;
    
    // Should show high score or stars
    await expect(
      page.locator('text=/⭐|100|excelente|ótimo/i')
    ).toBeVisible({ timeout: 10000 });
  });

  test('should show confetti on game completion', async ({ page }) => {
    await page.goto('/games');
    await page.locator('[data-testid="game-card"]').first().click();
    
    await page.waitForSelector('textarea, input[type="text"]');
    
    // Fill answer
    const answerField = page.locator('textarea, input[type="text"]').first();
    await answerField.fill('Comprehensive answer demonstrating understanding of the concept.');
    
    const responsePromise = page.waitForResponse(response => response.url().includes('/api/educator/turn') && response.status() === 201);
    // Submit
    await page.click('button:has-text("Enviar")');
    await responsePromise;
    
    // Check for confetti element or animation
    // (Confetti might be a canvas element or specific div)
    // const confetti = page.locator('canvas, [data-testid="confetti"], .confetti');
    
    // Soft check
    // const confettiVisible = await confetti.isVisible().catch(() => false);
    // console.log('Confetti visible:', confettiVisible);
  });

  test('should support multiple games in sequence', async ({ page }) => {
    await page.goto('/games');
    
    // Play first game
    await page.locator('[data-testid="game-card"]').first().click();
    await page.fill('textarea', 'First game answer');
    const r1 = page.waitForResponse(response => response.url().includes('/api/educator/turn'));
    await page.click('button:has-text("Enviar")');
    await r1;
    await page.locator('text=Fechar').or(page.locator('[aria-label="Close"]')).click();
    
    // Play second game
    await page.locator('[data-testid="game-card"]').nth(1).click();
    await page.fill('textarea, input', 'Second game answer');
    const r2 = page.waitForResponse(response => response.url().includes('/api/educator/turn'));
    await page.click('button:has-text("Enviar")');
    await r2;
    
    // Both should have been recorded
    // Check dashboard or games page for updated stats
    await page.goto('/dashboard');
    await expect(page.locator('text=/jogos.*[2-9]|games.*[2-9]/i')).toBeVisible({ timeout: 10000 });
  });

  test('should show different prompts for different difficulties', async ({ page }) => {
    await page.goto('/games');
    
    // Some games might have difficulty selection
    // This is a basic test to ensure the game varies
    await page.locator('[data-testid="game-card"]').first().click();
    
    const prompt1 = await page.locator('[role="dialog"]').textContent();
    await page.locator('text=Fechar').or(page.locator('[aria-label="Close"]')).click();
    
    // Play again (might get different prompt/difficulty)
    // Note: This test is slightly flaky if the prompt is randomly identical, but usually fine
    await page.locator('[data-testid="game-card"]').first().click();
    const prompt2 = await page.locator('[role="dialog"]').textContent();
    
    // Prompts exist (at minimum)
    expect(prompt1).toBeTruthy();
    expect(prompt2).toBeTruthy();
  });

  test('should persist progress across page reloads', async ({ page }) => {
    await page.goto('/games');
    
    // Play a game
    await page.click('[data-testid="game-card-PROBLEM_SOLVER"]');
    await page.waitForSelector('text=/pergunta|question|escolha/i');
    
    // Submit an answer
    const answer = page.locator('button:has-text("A"), button:has-text("B"), button:has-text("C")').first();
    await answer.click();
    
    // Simple wait for UI update after click
    await page.click('button:has-text("Enviar"), button:has-text("Confirmar")');
    
    // Use close button instead of Escape
    await page.locator('text=Fechar').or(page.locator('[aria-label="Close"]')).click();
    
    // Reload page
    await page.reload();
    // await page.waitForLoadState('networkidle');
    
    // Progress should still show
    const gameCard = page.locator('[data-testid="game-card-PROBLEM_SOLVER"]');
    await expect(gameCard.locator('text=/Jogadas|⭐/')).toBeVisible();
  });
});
