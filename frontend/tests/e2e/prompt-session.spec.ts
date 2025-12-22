import { test, expect } from '@playwright/test';

/**
 * E2E Tests for Prompt-Only Reading Sessions
 * 
 * Tests the full flow:
 * - Session creation
 * - PRE phase (goal, prediction, target words)
 * - DURING phase (checkpoints, unknown words)
 * - POST phase (recall, quiz, vocab, production)
 */

test.describe('Prompt-Only Reading Session Flow', () => {
  let sessionId: string;

  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.fill('[name="email"]', process.env.TEST_USER_EMAIL || 'test@example.com');
    await page.fill('[name="password"]', process.env.TEST_USER_PASSWORD || 'password123');
    await page.click('button[type="submit"]');
    
    // Wait for redirect to dashboard
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test('should complete full PRE → DURING → POST flow', async ({ page }) => {
    // Step 1: Start session
    await page.goto('/reading/new');
    
    // Select content (adjust selector based on your UI)
    await page.click('[data-content-id="ct_001"]');
    
    // Wait for session page to load
    await expect(page).toHaveURL(/\/reading\/[a-zA-Z0-9-]+/);
    
    // Extract session ID from URL
    const url = page.url();
    sessionId = url.split('/reading/')[1];
    
    // Verify PromptConsole is visible
    await expect(page.locator('.prompt-console')).toBeVisible();
    
    // ===== PRE PHASE =====
    
    // Should receive initial prompt asking for goal
    await expect(page.locator('.chat-bubble-agent').last()).toContainText(/meta|objetivo|goal/i);
    
    // Enter goal
    const goalInput = page.locator('.prompt-input');
    await goalInput.fill('Entender os conceitos principais do texto');
    await page.keyboard.press('Enter');
    
    // Wait for response
    await expect(page.locator('.chat-bubble-agent').last()).toBeVisible({ timeout: 10000 });
    
    // Should ask for prediction
    await expect(page.locator('.chat-bubble-agent').last()).toContainText(/previsão|prever|prediction/i);
    
    // Enter prediction
    await goalInput.fill('Acho que o texto trata de metodologias de aprendizagem');
    await page.keyboard.press('Enter');
    
    // Wait for target words proposal
    await expect(page.locator('.chat-bubble-agent').last()).toBeVisible({ timeout: 10000 });
    await expect(page.locator('.chat-bubble-agent').last()).toContainText(/palavra|word|target/i);
    
    // Should have quick replies (e.g., "Confirmar", "Outras")
    await expect(page.locator('.quick-reply-chip')).toHaveCount(2, { timeout: 5000 });
    
    // Click "Confirmar" or similar
    await page.click('[data-reply*="Confirmar"]');
    
    // ===== DURING PHASE =====
    
    // Mark unknown word using shortcut
    await goalInput.fill('/mark unknown: inferir, evidência');
    await page.keyboard.press('Enter');
    
    // Should acknowledge
    await expect(page.locator('.chat-bubble-agent').last()).toContainText(/registrado|acknowledged/i, { timeout: 10000 });
    
    // Should receive checkpoint
    await expect(page.locator('.chat-bubble-agent').last()).toContainText(/checkpoint/i, { timeout: 15000 });
    
    // Answer checkpoint
    await goalInput.fill('A ideia principal até aqui é sobre como aprender efetivamente');
    await page.keyboard.press('Enter');
    
    // Wait for feedback
    await expect(page.locator('.chat-bubble-agent').last()).toBeVisible({ timeout: 10000 });
    
    // Use quick reply to continue
    if (await page.locator('.quick-reply-chip').count() > 0) {
      await page.click('.quick-reply-chip >> nth=0');
    }
    
    // ===== POST PHASE =====
    
    // Should receive recall request
    await expect(page.locator('.chat-bubble-agent').last()).toContainText(/recall|lembrar|resumir/i, { timeout: 15000 });
    
    // Submit recall
    await goalInput.fill('Aprendi sobre técnicas de estudo ativo e a importância da metacognição');
    await page.keyboard.press('Enter');
    
    // Wait for quiz or next activity
    await expect(page.locator('.chat-bubble-agent').last()).toBeVisible({ timeout: 10000 });
    
    // Should eventually offer to finish
    // (Adjust based on your flow)
  });

  test('should display quick replies correctly', async ({ page }) => {
    await page.goto(`/reading/${sessionId || 'test-session-id'}`);
    
    // Wait for PromptConsole
    await expect(page.locator('.prompt-console')).toBeVisible();
    
    // If quick replies are present
    const quickReplies = page.locator('.quick-reply-chip');
    if (await quickReplies.count() > 0) {
      // Should be clickable
      await expect(quickReplies.first()).toBeEnabled();
      
      // Should have hover effect (check class or style)
      await quickReplies.first().hover();
      
      // Click should send prompt
      const initialMessageCount = await page.locator('.chat-bubble').count();
      await quickReplies.first().click();
      
      // Should add new message
      await expect(page.locator('.chat-bubble')).toHaveCount(initialMessageCount + 1, { timeout: 5000 });
    }
  });

  test('should handle shortcuts menu', async ({ page }) => {
    await page.goto(`/reading/${sessionId || 'test-session-id'}`);
    
    // Open shortcuts menu
    await page.click('.shortcuts-toggle');
    
    // Should display menu
    await expect(page.locator('.shortcuts-menu')).toBeVisible();
    
    // Should have shortcut items
    await expect(page.locator('.shortcut-item')).toHaveCount(4); // /mark, /checkpoint, /keyidea, /production
    
    // Click on /mark shortcut
    await page.click('.shortcut-button >> nth=0');
    
    // Should insert in input field
    const input = page.locator('.prompt-input');
    await expect(input).toHaveValue(/\/mark/);
    
    // Menu should close
    await expect(page.locator('.shortcuts-menu')).not.toBeVisible();
  });

  test('should show typing indicator when loading', async ({ page }) => {
    await page.goto(`/reading/${sessionId || 'test-session-id'}`);
    
    const input = page.locator('.prompt-input');
    await input.fill('Test message');
    await page.keyboard.press('Enter');
    
    // Should show typing indicator
    await expect(page.locator('.typing-indicator')).toBeVisible({ timeout: 2000 });
    
    // Should disappear when response arrives
    await expect(page.locator('.typing-indicator')).not.toBeVisible({ timeout: 10000 });
  });

  test('should handle errors gracefully', async ({ page }) => {
    // Mock API error (if possible with Playwright)
    await page.route('**/sessions/*/prompt', route => {
      route.abort('failed');
    });
    
    await page.goto(`/reading/${sessionId || 'test-session-id'}`);
    
    const input = page.locator('.prompt-input');
    await input.fill('Test message');
    await page.keyboard.press('Enter');
    
    // Should show error status
    await expect(page.locator('.chat-bubble.status-error')).toBeVisible({ timeout: 5000 });
    
    // Should show error message from agent
    await expect(page.locator('.chat-bubble-agent').last()).toContainText(/erro|error|desculpe/i);
  });

  test('should be mobile responsive', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    await page.goto(`/reading/${sessionId || 'test-session-id'}`);
    
    // On mobile, drawer should be bottom sheet style
    await expect(page.locator('.prompt-drawer')).toBeVisible();
    
    // Drawer should start collapsed, with floating icon visible
    await expect(page.locator('.prompt-drawer-floating-icon')).toBeVisible();
    
    // Cornell should take full width on mobile
    await expect(page.locator('.cornell-container')).toBeVisible();
    
    // Click floating icon to expand drawer
    await page.click('.prompt-drawer-floating-icon');
    
    // Drawer should expand as bottom sheet
    await expect(page.locator('.prompt-drawer-expanded')).toBeVisible();
    
    // Input should be usable
    const input = page.locator('.prompt-input');
    await expect(input).toBeVisible();
    await expect(input).toBeEnabled();
  });

  test('should auto-scroll to latest message', async ({ page }) => {
    await page.goto(`/reading/${sessionId || 'test-session-id'}`);
    
    // Send multiple messages
    const input = page.locator('.prompt-input');
    for (let i = 0; i < 5; i++) {
      await input.fill(`Message ${i}`);
      await page.keyboard.press('Enter');
      await page.waitForTimeout(2000); // Wait for response
    }
    
    // Latest message should be in viewport
    const lastBubble = page.locator('.chat-bubble').last();
    await expect(lastBubble).toBeInViewport();
  });
});

test.describe('Prompt Session Edge Cases', () => {
  test('should handle empty input', async ({ page }) => {
    await page.goto('/reading/test-session-id');
    
    // Try to send empty message
    const sendButton = page.locator('.prompt-send-button');
    await expect(sendButton).toBeDisabled();
    
    // Type space only
    const input = page.locator('.prompt-input');
    await input.fill('   ');
    
    // Should still be disabled
    await expect(sendButton).toBeDisabled();
  });

  test('should handle keyboard shortcuts', async ({ page }) => {
    await page.goto('/reading/test-session-id');
    
    const input = page.locator('.prompt-input');
    
    // Enter should send
    await input.fill('Test message');
    await page.keyboard.press('Enter');
    
    // Should clear input
    await expect(input).toHaveValue('');
    
    // Shift+Enter should create newline
    await input.fill('Line 1');
    await page.keyboard.press('Shift+Enter');
    await input.type('Line 2');
    
    // Should have both lines
    const value = await input.inputValue();
    expect(value).toContain('Line 1');
    expect(value).toContain('Line 2');
  });

  test('should handle drawer state transitions', async ({ page }) => {
    await page.goto('/reading/test-session-id');
    
    // 1. Should start collapsed (default)
    await expect(page.locator('.prompt-drawer-collapsed')).toBeVisible();
    await expect(page.locator('.prompt-drawer-floating-icon')).toBeVisible();
    
    // 2. Click to expand
    await page.click('.prompt-drawer-floating-icon');
    await expect(page.locator('.prompt-drawer-expanded')).toBeVisible();
    
    // 3. Click minimize button
    await page.click('.drawer-minimize');
    await expect(page.locator('.prompt-drawer-peek')).toBeVisible();
    
    //4. Click close button
    await page.click('.prompt-drawer-peek'); // Click to expand again
    await page.click('.drawer-close');
    await expect(page.locator('.prompt-drawer-collapsed')).toBeVisible();
  });

  test('should support keyboard shortcut Cmd+D', async ({ page }) => {
    await page.goto('/reading/test-session-id');
    
    // Start collapsed
    await expect(page.locator('.prompt-drawer-collapsed')).toBeVisible();
    
    // Cmd/Ctrl + D to toggle
    await page.keyboard.press('Control+d');
    await expect(page.locator('.prompt-drawer-expanded')).toBeVisible();
    
    // Press Escape to minimize
    await page.keyboard.press('Escape');
    await expect(page.locator('.prompt-drawer-peek')).toBeVisible();
  });
});
