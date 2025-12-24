import { test, expect } from '@playwright/test';

// Helper function for login
async function loginAsUser(page: any, email: string, password: string) {
  await page.goto('/login');
  await page.fill('[name="email"]', email);
  await page.fill('[name="password"]', password);
  await page.click('button[type="submit"]');
  await page.waitForURL('/dashboard');
}

test.describe('Sprint 1+2: Solo Reading Session Flow', () => {
  test.beforeEach(async ({ page, context }) => {
    // Clear context
    await context.clearCookies();
    await page.addInitScript(() => {
      window.localStorage.clear();
      window.sessionStorage.clear();
    });
    
    await loginAsUser(page, 'maria@example.com', 'demo123');
  });

  test('should create and access solo reading session with media content', async ({ page }) => {
    // Navigate to dashboard
    await page.goto('/dashboard');
    
    // Wait for dashboard to load
    await expect(page.locator('h1')).toContainText('Dashboard');

    // Create new VIDEO content
    await page.click('text=Add Content');
    await page.fill('[name="title"]', 'Test Video Lecture');
    await page.selectOption('[name="type"]', 'VIDEO');
    await page.fill('[name="duration"]', '300'); // 5 minutes
    await page.fill('[name="rawText"]', 'Video transcription content');
    await page.click('button[type="submit"]');

    // Wait for content creation
    await expect(page.locator('text=Test Video Lecture')).toBeVisible();

    // Click on content to start session
    await page.click('text=Test Video Lecture');
    
    // Should navigate to reading page
    await expect(page).toHaveURL(/\/reading\/[a-f0-9-]+/);

    // Verify page elements load
    await expect(page.locator('[data-testid="cornell-layout"]')).toBeVisible();
    await expect(page.locator('[data-testid="prompt-console"]')).toBeVisible();

    // Verify content title is displayed
    await expect(page.locator('text=Test Video Lecture')).toBeVisible();
  });

  test('should load existing session with messages', async ({ page }) => {
    // This test assumes a session exists from previous test or fixtures
    // Navigate directly to a known session
    await page.goto('/sessions');
    
    // Click on first session
    await page.click('[data-testid="session-item"]');

    // Wait for redirect to reading page
    await expect(page).toHaveURL(/\/reading\/[a-f0-9-]+/);

    // Verify prompt console shows messages
    const messagesContainer = page.locator('[data-testid="messages-container"]');
    await expect(messagesContainer).toBeVisible();

    // Check if quick replies are displayed (if they exist)
    const quickReplies = page.locator('[data-testid="quick-reply"]');
    const count = await quickReplies.count();
    if (count > 0) {
      await expect(quickReplies.first()).toBeVisible();
    }
  });

  test('should send prompt and receive response', async ({ page }) => {
    // Navigate to sessions
    await page.goto('/sessions');
    
    // Start new session or select existing
    await page.click('[data-testid="start-session"]');

    // Wait for reading page
    await page.waitForURL(/\/reading\/[a-f0-9-]+/);

    // Type a prompt
    const promptInput = page.locator('[data-testid="prompt-input"]');
    await promptInput.fill('What is the main idea of this content?');
    await page.click('[data-testid="send-prompt"]');

    // Wait for response
    await expect(page.locator('text=What is the main idea')).toBeVisible();
    
    // Response should appear (EDUCATOR message)
    await page.waitForTimeout(2000); // Wait for AI response
    const messages = page.locator('[data-testid="message"]');
    await expect(messages).toHaveCount(2, { timeout: 10000 }); // USER + EDUCATOR
  });

  test('should display media file info when content has storageKey', async ({ page }) => {
    // Navigate to content list
    await page.goto('/contents');

    // Find VIDEO content
    await page.click('text=VIDEO');

    // Check if storage info is displayed
    const storageInfo = page.locator('[data-testid="storage-key"]');
    if (await storageInfo.count() > 0) {
      await expect(storageInfo).toBeVisible();
      await expect(storageInfo).toContainText('.mp4');
    }
  });
});

test.describe('Sprint 3: Annotation Interactions', () => {
  test.beforeEach(async ({ page, context }) => {
    await context.clearCookies();
    await page.addInitScript(() => {
      window.localStorage.clear();
      window.sessionStorage.clear();
    });
    
    await loginAsUser(page, 'maria@example.com', 'demo123');
  });

  test('should toggle annotation favorite', async ({ page }) => {
    // Navigate to content with annotations
    await page.goto('/reader/test-content-id'); // Replace with actual test ID

    // Wait for annotations to load
    await page.waitForSelector('[data-testid="annotation"]');

    // Click favorite button on first annotation
    const favoriteButton = page.locator('[data-testid="favorite-button"]').first();
    await favoriteButton.click();

    // Verify favorite state changed
    await expect(favoriteButton).toHaveClass(/favorited/);

    // Toggle off
    await favoriteButton.click();
    await expect(favoriteButton).not.toHaveClass(/favorited/);
  });

  test('should create annotation reply', async ({ page }) => {
    // Navigate to annotations view
    await page.goto('/annotations');

    // Find annotation with reply option
    await page.click('[data-testid="annotation-item"]');

    // Click reply button
    await page.click('[data-testid="reply-button"]');

    // Type reply
    const replyInput = page.locator('[data-testid="reply-input"]');
    await replyInput.fill('This is a test reply');

    // Submit
    await page.click('[data-testid="submit-reply"]');

    // Verify reply appears
    await expect(page.locator('text=This is a test reply')).toBeVisible();
  });

  test('should search annotations', async ({ page }) => {
    // Navigate to annotations
    await page.goto('/annotations');

    // Use search
    const searchInput = page.locator('[data-testid="search-input"]');
    await searchInput.fill('important');

    // Press enter or click search
    await searchInput.press('Enter');

    // Verify filtered results
    await expect(page.locator('[data-testid="annotation-item"]')).toBeVisible();
  });
});

test.describe('Reading Session - Solo Mode (No Group)', () => {
  test.beforeEach(async ({ page, context }) => {
    await context.clearCookies();
    await page.addInitScript(() => {
      window.localStorage.clear();
      window.sessionStorage.clear();
    });
    
    await loginAsUser(page, 'maria@example.com', 'demo123');
  });

  test('should work without group context', async ({ page }) => {
    // Navigate directly to reading page (solo mode)
    await page.goto('/reading/test-session-id'); // Replace with actual solo session

    // Should not error even without group
    await page.waitForLoadState('networkidle');

    // Verify core elements load
    await expect(page.locator('[data-testid="cornell-layout"]')).toBeVisible({ timeout: 10000 });
    
    // Should not show group-related elements
    await expect(page.locator('[data-testid="group-members"]')).not.toBeVisible();
  });
});

test.describe('Frontend Build Verification', () => {
  test('video content type is available in forms', async ({ page }) => {
    await loginAsUser(page, 'maria@example.com', 'demo123');
    
    await page.goto('/contents/new');
    
    const typeSelect = page.locator('select[name="type"]');
    await expect(typeSelect).toBeVisible();
    
    // Verify VIDEO and AUDIO options exist
    const options = await typeSelect.locator('option').allTextContents();
    expect(options).toContain('VIDEO');
    expect(options).toContain('AUDIO');
  });

  test('duration field is available for media content', async ({ page }) => {
    await loginAsUser(page, 'maria@example.com', 'demo123');
    
    await page.goto('/contents/new');
    
    // Select VIDEO type
    await page.selectOption('select[name="type"]', 'VIDEO');
    
    // Duration field should appear
    const durationInput = page.locator('input[name="duration"]');
    await expect(durationInput).toBeVisible();
  });
});
