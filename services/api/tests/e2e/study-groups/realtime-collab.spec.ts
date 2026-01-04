import { test, expect } from "@playwright/test";
import { TEST_USERS } from "../fixtures/test-data";
import { loginAs, waitForWebSocketConnection } from "../helpers/test-helpers";

/**
 * Study Groups - Real-Time Collaboration E2E Tests
 *
 * Tests WebSocket real-time events across multiple users
 */

test.describe("Real-Time Collaboration - WebSocket", () => {
  let sessionId: string;
  let groupId: string;

  test.beforeAll(async () => {
    // Setup: These would be created via API or previous tests
    // For now, placeholders
  });

  test("session start event propagates to all members immediately", async ({
    browser,
  }) => {
    // Create 2 browser contexts (simulating 2 users)
    const facilitatorContext = await browser.newContext();
    const memberContext = await browser.newContext();

    const facilitatorPage = await facilitatorContext.newPage();
    const memberPage = await memberContext.newPage();

    try {
      // Login both users
      await loginAs(facilitatorPage, TEST_USERS.facilitator.email);
      await loginAs(memberPage, TEST_USERS.member1.email);

      // Navigate to same session
      const testSessionId = "test-session-id"; // Would come from setup
      await facilitatorPage.goto(
        `/groups/test-group/sessions/${testSessionId}`,
      );
      await memberPage.goto(`/groups/test-group/sessions/${testSessionId}`);

      // Wait for WebSocket connection
      await waitForWebSocketConnection(facilitatorPage);
      await waitForWebSocketConnection(memberPage);

      // Member waits for statuschange
      const statusChangedPromise = memberPage.waitForSelector(
        "text=/RUNNING|Em andamento/i",
        { timeout: 2000 },
      );

      // Facilitator starts session
      await facilitatorPage.click(
        'button:has-text("Start Session"), button:has-text("Iniciar Sessão")',
      );

      // Member should see change within 1 second
      await expect(statusChangedPromise).resolves.toBeTruthy();

      // Verify status on member page
      await expect(
        memberPage.locator("text=/RUNNING|Em andamento/i"),
      ).toBeVisible();
    } finally {
      await facilitatorContext.close();
      await memberContext.close();
    }
  });

  test("vote submission updates vote count in real-time", async ({
    browser,
  }) => {
    const user1Context = await browser.newContext();
    const user2Context = await browser.newContext();

    const page1 = await user1Context.newPage();
    const page2 = await user2Context.newPage();

    try {
      await loginAs(page1, TEST_USERS.facilitator.email);
      await loginAs(page2, TEST_USERS.member1.email);

      // Both navigate to session in VOTING phase
      const sessionUrl = "/groups/test-group/sessions/test-session";
      await page1.goto(sessionUrl);
      await page2.goto(sessionUrl);

      await waitForWebSocketConnection(page1);
      await waitForWebSocketConnection(page2);

      // Page 1 watches for vote count change
      const voteCountLocator = page1.locator(
        '[data-testid="vote-count"], text=/\\d+\\/\\d+ voted/i',
      );
      const initialText = await voteCountLocator.textContent();

      // Page 2 submits vote
      await page2.click('button[data-choice="A"]');
      await page2.click(
        'button:has-text("Submit Vote"), button:has-text("Enviar Voto")',
      );

      // Wait for count to update on page 1
      await expect(voteCountLocator).not.toHaveText(initialText || "", {
        timeout: 2000,
      });
    } finally {
      await user1Context.close();
      await user2Context.close();
    }
  });

  test("chat messages appear in real-time", async ({ browser }) => {
    const user1Context = await browser.newContext();
    const user2Context = await browser.newContext();

    const page1 = await user1Context.newPage();
    const page2 = await user2Context.newPage();

    try {
      await loginAs(page1, TEST_USERS.facilitator.email);
      await loginAs(page2, TEST_USERS.member1.email);

      const sessionUrl = "/groups/test-group/sessions/test-session";
      await page1.goto(sessionUrl);
      await page2.goto(sessionUrl);

      await waitForWebSocketConnection(page1);
      await waitForWebSocketConnection(page2);

      const testMessage = `Test message ${Date.now()}`;

      // Page 2 waits for message
      const messagePromise = page2.waitForSelector(`text=${testMessage}`, {
        timeout: 3000,
      });

      // Page 1 sends message
      await page1.fill(
        'textarea[placeholder*="mensagem"], textarea[name="message"]',
        testMessage,
      );
      await page1.press(
        'textarea[placeholder*="mensagem"], textarea[name="message"]',
        "Enter",
      );

      // Message should appear on page 2
      await expect(messagePromise).resolves.toBeTruthy();
    } finally {
      await user1Context.close();
      await user2Context.close();
    }
  });

  test("connection status shows Live when connected", async ({ page }) => {
    await loginAs(page, TEST_USERS.facilitator.email);

    await page.goto("/groups/test-group/sessions/test-session");

    // Connection status should show Live/Conectado
    await expect(
      page.locator('text=/Live|Conectado/i, [data-ws-status="connected"]'),
    ).toBeVisible({ timeout: 5000 });
  });

  test.skip("reconnection works after network drop", async ({ page }) => {
    // This requires network condition manipulation
    test.skip();
  });

  test.skip("users in different sessions dont see each others events", async ({
    browser,
  }) => {
    // Would require creating 2 separate sessions
    test.skip();
  });
});
