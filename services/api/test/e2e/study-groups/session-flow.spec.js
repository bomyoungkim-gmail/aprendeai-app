"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const test_1 = require("@playwright/test");
const test_data_1 = require("../fixtures/test-data");
const test_helpers_1 = require("../helpers/test-helpers");
test_1.test.describe("Study Groups - Session Flow", () => {
    let groupId;
    let sessionId;
    test_1.test.beforeEach(async ({ page }) => {
        await (0, test_helpers_1.loginAs)(page, test_data_1.TEST_USERS.facilitator.email);
    });
    (0, test_1.test)("facilitator can create PI Sprint session", async ({ page }) => {
        await page.goto(`/groups/test-group-id`);
        await page.click('button:has-text("Create Session"), button:has-text("Nova Sessão")');
        await page.click('[data-testid="content-selector"]');
        await page.click("text=Test Content");
        await page.selectOption('select[name="mode"]', "PI_SPRINT");
        await page.fill('input[name="rounds"]', "2");
        await page.click('button[type="submit"]');
        await (0, test_1.expect)(page).toHaveURL(/\/sessions\/[a-f0-9-]+/);
        await (0, test_1.expect)(page.locator("text=/CREATED|Criada/i")).toBeVisible();
    });
    (0, test_1.test)("session shows correct initial status CREATED", async ({ page }) => {
        await page.goto(`/groups/test-group/sessions/test-session`);
        await (0, test_1.expect)(page.locator('[data-testid="session-status"], text=/CREATED|Criada/i')).toBeVisible();
        await (0, test_1.expect)(page.locator('button:has-text("Start"), button:has-text("Iniciar")')).toBeVisible();
    });
    (0, test_1.test)("members can see assigned roles", async ({ page }) => {
        await page.goto(`/groups/test-group/sessions/test-session`);
        await (0, test_1.expect)(page.locator('[data-testid="user-role"], text=/FACILITATOR|TIMEKEEPER|CLARIFIER|CONNECTOR|SCRIBE/i')).toBeVisible();
    });
    (0, test_1.test)("facilitator starts session and status changes to RUNNING", async ({ page, }) => {
        await page.goto(`/groups/test-group/sessions/test-session`);
        await page.click('button:has-text("Start"), button:has-text("Iniciar Sessão")');
        await (0, test_1.expect)(page.locator("text=/RUNNING|Em andamento/i")).toBeVisible({
            timeout: 5000,
        });
        await (0, test_1.expect)(page.locator("text=/Round 1|Rodada 1/i")).toBeVisible();
    });
    (0, test_1.test)("round starts in VOTING phase", async ({ page }) => {
        await page.goto(`/groups/test-group/sessions/test-session-running`);
        await (0, test_1.expect)(page.locator("text=/VOTING|Votação/i")).toBeVisible();
        await (0, test_1.expect)(page.locator('button[data-choice="A"]')).toBeVisible();
        await (0, test_1.expect)(page.locator('button[data-choice="B"]')).toBeVisible();
    });
    (0, test_1.test)("users can submit votes", async ({ page }) => {
        await page.goto(`/groups/test-group/sessions/test-session-running`);
        await page.click('button[data-choice="A"]');
        await page.click('button:has-text("Submit Vote"), button:has-text("Confirmar Voto")');
        await (0, test_1.expect)(page.locator("text=/Vote submitted|Voto enviado/i")).toBeVisible();
    });
    (0, test_1.test)("cannot advance without all votes (409 error)", async ({ page }) => {
        await page.goto(`/groups/test-group/sessions/test-session-voting`);
        await page.click('button:has-text("Advance"), button:has-text("Avançar")');
        await (0, test_1.expect)(page.locator("text=/waiting for|aguardando|all members/i")).toBeVisible();
    });
    (0, test_1.test)("facilitator advances to DISCUSSING after all votes", async ({ page, }) => {
        await page.goto(`/groups/test-group/sessions/test-session-all-voted`);
        const advanceBtn = page.locator('button:has-text("Advance"):not(:disabled)');
        await advanceBtn.click();
        await (0, test_1.expect)(page.locator("text=/DISCUSSING|Discussão/i")).toBeVisible({
            timeout: 3000,
        });
    });
    (0, test_1.test)("chat is visible during DISCUSSING phase", async ({ page }) => {
        await page.goto(`/groups/test-group/sessions/test-session-discussing`);
        await (0, test_1.expect)(page.locator('[data-testid="chat-panel"], text=/Chat.*Discussão/i')).toBeVisible();
        await (0, test_1.expect)(page.locator('textarea[placeholder*="mensagem"]')).toBeVisible();
    });
    (0, test_1.test)("scribe can submit group explanation", async ({ page, context }) => {
        await context.clearCookies();
        await (0, test_helpers_1.loginAs)(page, test_data_1.TEST_USERS.member2.email);
        await page.goto(`/groups/test-group/sessions/test-session-discussing`);
        await page.fill('textarea[name="explanation"], textarea[placeholder*="explicação"]', "This is the group explanation for choice A");
        await page.click('button:has-text("Submit Explanation"), button:has-text("Enviar Explicação")');
        await (0, test_1.expect)(page.locator("text=/Explanation submitted|Explicação enviada/i")).toBeVisible();
    });
    (0, test_1.test)("shared card appears after submission", async ({ page }) => {
        await page.goto(`/groups/test-group/sessions/test-session-with-card`);
        await (0, test_1.expect)(page.locator('[data-testid="shared-card"]')).toBeVisible();
        await (0, test_1.expect)(page.locator("text=This is the group explanation")).toBeVisible();
    });
    (0, test_1.test)("facilitator ends session and shows final results", async ({ page }) => {
        await page.goto(`/groups/test-group/sessions/test-session-running`);
        await page.click('button:has-text("End Session"), button:has-text("Finalizar Sessão")');
        await page.click('button:has-text("Confirm"), button:has-text("Confirmar")');
        await (0, test_1.expect)(page.locator("text=/FINISHED|Finalizada/i")).toBeVisible({
            timeout: 5000,
        });
        await (0, test_1.expect)(page.locator("text=/Results|Resultados/i")).toBeVisible();
    });
});
//# sourceMappingURL=session-flow.spec.js.map