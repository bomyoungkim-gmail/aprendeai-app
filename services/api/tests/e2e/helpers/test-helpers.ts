import { Page } from "@playwright/test";

/**
 * Test helper functions for E2E tests
 */

/**
 * Login as a user
 */
export async function loginAs(
  page: Page,
  email: string,
  password: string = "Test123!@#",
) {
  await page.goto("/login");

  await page.fill('input[name="email"], input[type="email"]', email);
  await page.fill('input[name="password"], input[type="password"]', password);

  await page.click('button[type="submit"]');

  // Wait for redirect to dashboard
  await page.waitForURL(/\/(dashboard|groups)/, { timeout: 10000 });
}

/**
 * Logout current user
 */
export async function logout(page: Page) {
  // Click user menu or logout button
  await page.click(
    '[aria-label="User menu"], button:has-text("Logout"), a:has-text("Sair")',
  );
  await page.waitForURL("/login");
}

/**
 * Create a new study group
 */
export async function createGroup(page: Page, name: string): Promise<string> {
  await page.goto("/groups");

  // Click create group button
  await page.click(
    'button:has-text("Create Group"), button:has-text("Criar Grupo")',
  );

  // Fill name
  await page.fill('input[name="name"]', name);

  // Submit
  await page.click(
    'button[type="submit"], button:has-text("Create"), button:has-text("Criar")',
  );

  // Wait for redirect and extract group ID
  await page.waitForURL(/\/groups\/[a-f0-9-]+/);
  const url = page.url();
  const groupId = url.match(/\/groups\/([a-f0-9-]+)/)?.[1];

  if (!groupId) throw new Error("Failed to extract group ID");

  return groupId;
}

/**
 * Upload content file
 */
export async function uploadContent(
  page: Page,
  filePath: string,
  title: string,
): Promise<void> {
  await page.goto("/dashboard");

  // Click upload button
  await page.click(
    'button:has-text("Upload"), button:has-text("Fazer Upload")',
  );

  // Upload file
  const fileInput = await page.locator('input[type="file"]');
  await fileInput.setInputFiles(filePath);

  // Wait for file to be loaded
  await page.waitForSelector(
    "text=" + filePath.split(/[\\/]/).pop()?.substring(0, 20) || "test",
  );

  // Fill title
  await page.fill('input[name="title"]', title);

  // Submit
  await page.click(
    'button:has-text("Upload"), button:has-text("Fazer Upload"):not(:disabled)',
  );

  // Wait for success (modal closes)
  await page.waitForSelector('button:has-text("Fazer Upload")', {
    state: "hidden",
    timeout: 15000,
  });
}

/**
 * Create a study session
 */
export async function createSession(
  page: Page,
  groupId: string,
  contentId: string,
): Promise<string> {
  await page.goto(`/groups/${groupId}`);

  // Click create session
  await page.click(
    'button:has-text("Create Session"), button:has-text("Nova Sessão")',
  );

  // Select content (assuming dropdown or selection UI)
  // This may need adjustment based on actual UI
  await page.click(
    `[data-content-id="${contentId}"], li:has-text("Test Content")`,
  );

  // Configure session (PI_SPRINT, 2 rounds, etc)
  await page.selectOption('select[name="mode"]', "PI_SPRINT");
  await page.fill('input[name="roundsCount"]', "2");

  // Submit
  await page.click('button[type="submit"]');

  // Extract session ID
  await page.waitForURL(/\/sessions\/[a-f0-9-]+/);
  const url = page.url();
  const sessionId = url.match(/\/sessions\/([a-f0-9-]+)/)?.[1];

  if (!sessionId) throw new Error("Failed to extract session ID");

  return sessionId;
}

/**
 * Wait for WebSocket connection status
 */
export async function waitForWebSocketConnection(page: Page, timeout = 5000) {
  await page.waitForSelector(
    '[data-ws-status="connected"], text=/Live|Conectado/i',
    { timeout },
  );
}

/**
 * Clean up test data (for afterEach hooks)
 */
export async function cleanupTestData(
  page: Page,
  options: {
    groupIds?: string[];
    contentIds?: string[];
  },
) {
  // This would call API endpoints or use database cleanup
  // For now, just a placeholder

  if (options.groupIds) {
    for (const groupId of options.groupIds) {
      try {
        await page.request.delete(`http://localhost:8000/groups/${groupId}`);
      } catch (e) {
        console.warn(`Failed to delete group ${groupId}:`, e);
      }
    }
  }
}

/**
 * Generate random email for testing
 */
export function generateTestEmail(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(7);
  return `test-${timestamp}-${random}@example.com`;
}

/**
 * Wait for element with text to appear
 */
export async function waitForText(page: Page, text: string, timeout = 5000) {
  await page.waitForSelector(`text=${text}`, { timeout });
}
