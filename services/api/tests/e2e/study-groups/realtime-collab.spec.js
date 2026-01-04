"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const test_1 = require("@playwright/test");
const test_data_1 = require("../fixtures/test-data");
const test_helpers_1 = require("../helpers/test-helpers");
test_1.test.describe("Real-Time Collaboration - WebSocket", () => {
    let sessionId;
    let groupId;
    test_1.test.beforeAll(async () => {
    });
    (0, test_1.test)("session start event propagates to all members immediately", async ({ browser, }) => {
        const facilitatorContext = await browser.newContext();
        const memberContext = await browser.newContext();
        const facilitatorPage = await facilitatorContext.newPage();
        const memberPage = await memberContext.newPage();
        try {
            await (0, test_helpers_1.loginAs)(facilitatorPage, test_data_1.TEST_USERS.facilitator.email);
            await (0, test_helpers_1.loginAs)(memberPage, test_data_1.TEST_USERS.member1.email);
            const testSessionId = "test-session-id";
            await facilitatorPage.goto(`/groups/test-group/sessions/${testSessionId}`);
            await memberPage.goto(`/groups/test-group/sessions/${testSessionId}`);
            await (0, test_helpers_1.waitForWebSocketConnection)(facilitatorPage);
            await (0, test_helpers_1.waitForWebSocketConnection)(memberPage);
            const statusChangedPromise = memberPage.waitForSelector("text=/RUNNING|Em andamento/i", { timeout: 2000 });
            await facilitatorPage.click('button:has-text("Start Session"), button:has-text("Iniciar Sessão")');
            await (0, test_1.expect)(statusChangedPromise).resolves.toBeTruthy();
            await (0, test_1.expect)(memberPage.locator("text=/RUNNING|Em andamento/i")).toBeVisible();
        }
        finally {
            await facilitatorContext.close();
            await memberContext.close();
        }
    });
    (0, test_1.test)("vote submission updates vote count in real-time", async ({ browser, }) => {
        const user1Context = await browser.newContext();
        const user2Context = await browser.newContext();
        const page1 = await user1Context.newPage();
        const page2 = await user2Context.newPage();
        try {
            await (0, test_helpers_1.loginAs)(page1, test_data_1.TEST_USERS.facilitator.email);
            await (0, test_helpers_1.loginAs)(page2, test_data_1.TEST_USERS.member1.email);
            const sessionUrl = "/groups/test-group/sessions/test-session";
            await page1.goto(sessionUrl);
            await page2.goto(sessionUrl);
            await (0, test_helpers_1.waitForWebSocketConnection)(page1);
            await (0, test_helpers_1.waitForWebSocketConnection)(page2);
            const voteCountLocator = page1.locator('[data-testid="vote-count"], text=/\\d+\\/\\d+ voted/i');
            const initialText = await voteCountLocator.textContent();
            await page2.click('button[data-choice="A"]');
            await page2.click('button:has-text("Submit Vote"), button:has-text("Enviar Voto")');
            await (0, test_1.expect)(voteCountLocator).not.toHaveText(initialText || "", {
                timeout: 2000,
            });
        }
        finally {
            await user1Context.close();
            await user2Context.close();
        }
    });
    (0, test_1.test)("chat messages appear in real-time", async ({ browser }) => {
        const user1Context = await browser.newContext();
        const user2Context = await browser.newContext();
        const page1 = await user1Context.newPage();
        const page2 = await user2Context.newPage();
        try {
            await (0, test_helpers_1.loginAs)(page1, test_data_1.TEST_USERS.facilitator.email);
            await (0, test_helpers_1.loginAs)(page2, test_data_1.TEST_USERS.member1.email);
            const sessionUrl = "/groups/test-group/sessions/test-session";
            await page1.goto(sessionUrl);
            await page2.goto(sessionUrl);
            await (0, test_helpers_1.waitForWebSocketConnection)(page1);
            await (0, test_helpers_1.waitForWebSocketConnection)(page2);
            const testMessage = `Test message ${Date.now()}`;
            const messagePromise = page2.waitForSelector(`text=${testMessage}`, {
                timeout: 3000,
            });
            await page1.fill('textarea[placeholder*="mensagem"], textarea[name="message"]', testMessage);
            await page1.press('textarea[placeholder*="mensagem"], textarea[name="message"]', "Enter");
            await (0, test_1.expect)(messagePromise).resolves.toBeTruthy();
        }
        finally {
            await user1Context.close();
            await user2Context.close();
        }
    });
    (0, test_1.test)("connection status shows Live when connected", async ({ page }) => {
        await (0, test_helpers_1.loginAs)(page, test_data_1.TEST_USERS.facilitator.email);
        await page.goto("/groups/test-group/sessions/test-session");
        await (0, test_1.expect)(page.locator('text=/Live|Conectado/i, [data-ws-status="connected"]')).toBeVisible({ timeout: 5000 });
    });
    test_1.test.skip("reconnection works after network drop", async ({ page }) => {
        test_1.test.skip();
    });
    test_1.test.skip("users in different sessions dont see each others events", async ({ browser, }) => {
        test_1.test.skip();
    });
});
//# sourceMappingURL=realtime-collab.spec.js.map