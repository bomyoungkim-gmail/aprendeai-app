import { test, expect } from "@playwright/test";
import { TEST_USERS } from "../fixtures/test-data";
import { loginAs } from "../helpers/test-helpers";

/**
 * Study Groups - Session Flow E2E Tests
 *
 * Tests complete session lifecycle from creation to completion
 */

test.describe("Study Groups - Session Flow", () => {
  let groupId: string;
  let sessionId: string;

  test.beforeEach(async ({ page }) => {
    await loginAs(page, TEST_USERS.facilitator.email);
  });

  test("facilitator can create PI Sprint session", async ({ page }) => {
    // Assume group and content already exist
    await page.goto(`/groups/test-group-id`);

    // Click create session
    await page.click(
      'button:has-text("Create Session"), button:has-text("Nova Sessão")',
    );

    // Select content
    await page.click('[data-testid="content-selector"]');
    await page.click("text=Test Content");

    // Configure session
    await page.selectOption('select[name="mode"]', "PI_SPRINT");
    await page.fill('input[name="rounds"]', "2");

    // Submit
    await page.click('button[type="submit"]');

    // Should redirect to session page
    await expect(page).toHaveURL(/\/sessions\/[a-f0-9-]+/);

    // Status should be CREATED
    await expect(page.locator("text=/CREATED|Criada/i")).toBeVisible();
  });

  test("session shows correct initial status CREATED", async ({ page }) => {
    await page.goto(`/groups/test-group/sessions/test-session`);

    // Status badge
    await expect(
      page.locator('[data-testid="session-status"], text=/CREATED|Criada/i'),
    ).toBeVisible();

    // Start button should be visible for facilitator
    await expect(
      page.locator('button:has-text("Start"), button:has-text("Iniciar")'),
    ).toBeVisible();
  });

  test("members can see assigned roles", async ({ page }) => {
    await page.goto(`/groups/test-group/sessions/test-session`);

    // Role badge should be visible
    await expect(
      page.locator(
        '[data-testid="user-role"], text=/FACILITATOR|TIMEKEEPER|CLARIFIER|CONNECTOR|SCRIBE/i',
      ),
    ).toBeVisible();
  });

  test("facilitator starts session and status changes to RUNNING", async ({
    page,
  }) => {
    await page.goto(`/groups/test-group/sessions/test-session`);

    // Click start
    await page.click(
      'button:has-text("Start"), button:has-text("Iniciar Sessão")',
    );

    // Status should change
    await expect(page.locator("text=/RUNNING|Em andamento/i")).toBeVisible({
      timeout: 5000,
    });

    // Round 1 should be active
    await expect(page.locator("text=/Round 1|Rodada 1/i")).toBeVisible();
  });

  test("round starts in VOTING phase", async ({ page }) => {
    await page.goto(`/groups/test-group/sessions/test-session-running`);

    // Phase indicator
    await expect(page.locator("text=/VOTING|Votação/i")).toBeVisible();

    // Vote options should be visible
    await expect(page.locator('button[data-choice="A"]')).toBeVisible();
    await expect(page.locator('button[data-choice="B"]')).toBeVisible();
  });

  test("users can submit votes", async ({ page }) => {
    await page.goto(`/groups/test-group/sessions/test-session-running`);

    // Select choice A
    await page.click('button[data-choice="A"]');

    // Confirm selection (if modal)
    await page.click(
      'button:has-text("Submit Vote"), button:has-text("Confirmar Voto")',
    );

    // Success message or vote indicator
    await expect(
      page.locator("text=/Vote submitted|Voto enviado/i"),
    ).toBeVisible();
  });

  test("cannot advance without all votes (409 error)", async ({ page }) => {
    await page.goto(`/groups/test-group/sessions/test-session-voting`);

    // Try to advance without all votes
    await page.click('button:has-text("Advance"), button:has-text("Avançar")');

    // Error message should appear
    await expect(
      page.locator("text=/waiting for|aguardando|all members/i"),
    ).toBeVisible();
  });

  test("facilitator advances to DISCUSSING after all votes", async ({
    page,
  }) => {
    // Assume all votes are in
    await page.goto(`/groups/test-group/sessions/test-session-all-voted`);

    // Advance button should be enabled
    const advanceBtn = page.locator(
      'button:has-text("Advance"):not(:disabled)',
    );
    await advanceBtn.click();

    // Phase should change
    await expect(page.locator("text=/DISCUSSING|Discussão/i")).toBeVisible({
      timeout: 3000,
    });
  });

  test("chat is visible during DISCUSSING phase", async ({ page }) => {
    await page.goto(`/groups/test-group/sessions/test-session-discussing`);

    // Chat panel
    await expect(
      page.locator('[data-testid="chat-panel"], text=/Chat.*Discussão/i'),
    ).toBeVisible();

    // Message input
    await expect(
      page.locator('textarea[placeholder*="mensagem"]'),
    ).toBeVisible();
  });

  test("scribe can submit group explanation", async ({ page, context }) => {
    // Login as scribe
    await context.clearCookies();
    await loginAs(page, TEST_USERS.member2.email); // Assume member2 is scribe

    await page.goto(`/groups/test-group/sessions/test-session-discussing`);

    // Fill explanation
    await page.fill(
      'textarea[name="explanation"], textarea[placeholder*="explicação"]',
      "This is the group explanation for choice A",
    );

    // Submit
    await page.click(
      'button:has-text("Submit Explanation"), button:has-text("Enviar Explicação")',
    );

    // Success
    await expect(
      page.locator("text=/Explanation submitted|Explicação enviada/i"),
    ).toBeVisible();
  });

  test("shared card appears after submission", async ({ page }) => {
    await page.goto(`/groups/test-group/sessions/test-session-with-card`);

    // Shared card should be visible
    await expect(page.locator('[data-testid="shared-card"]')).toBeVisible();

    // Card should show explanation
    await expect(
      page.locator("text=This is the group explanation"),
    ).toBeVisible();
  });

  test("facilitator ends session and shows final results", async ({ page }) => {
    await page.goto(`/groups/test-group/sessions/test-session-running`);

    // End session
    await page.click(
      'button:has-text("End Session"), button:has-text("Finalizar Sessão")',
    );

    // Confirm
    await page.click(
      'button:has-text("Confirm"), button:has-text("Confirmar")',
    );

    // Status changes to FINISHED
    await expect(page.locator("text=/FINISHED|Finalizada/i")).toBeVisible({
      timeout: 5000,
    });

    // Results should be visible
    await expect(page.locator("text=/Results|Resultados/i")).toBeVisible();
  });
});
