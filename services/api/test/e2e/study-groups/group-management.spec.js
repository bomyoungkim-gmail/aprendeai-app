"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const test_1 = require("@playwright/test");
const test_data_1 = require("../fixtures/test-data");
const test_helpers_1 = require("../helpers/test-helpers");
test_1.test.describe("Study Groups - Management", () => {
    let groupId;
    test_1.test.beforeEach(async ({ page }) => {
        await (0, test_helpers_1.loginAs)(page, test_data_1.TEST_USERS.facilitator.email);
    });
    (0, test_1.test)("user can create a study group", async ({ page }) => {
        var _a;
        await page.goto("/groups");
        await page.click('button:has-text("Create Group"), button:has-text("Criar Grupo")');
        await page.fill('input[name="name"]', test_data_1.TEST_GROUP.name);
        await page.click('button[type="submit"]');
        await (0, test_1.expect)(page).toHaveURL(/\/groups\/[a-f0-9-]+/);
        await (0, test_1.expect)(page.locator(`text=${test_data_1.TEST_GROUP.name}`)).toBeVisible();
        groupId = ((_a = page.url().match(/\/groups\/([a-f0-9-]+)/)) === null || _a === void 0 ? void 0 : _a[1]) || "";
    });
    (0, test_1.test)("owner can invite member to group", async ({ page }) => {
        groupId = await (0, test_helpers_1.createGroup)(page, "Invite Test Group");
        await page.goto(`/groups/${groupId}`);
        await page.click('button:has-text("Invite"), button:has-text("Convidar")');
        await page.fill('input[name="email"], input[type="email"]', test_data_1.TEST_USERS.member1.email);
        await page.selectOption('select[name="role"]', "MEMBER");
        await page.click('button:has-text("Send"), button:has-text("Enviar")');
        await (0, test_1.expect)(page.locator("text=/Invited|Convite enviado/i")).toBeVisible();
        await (0, test_1.expect)(page.locator(`text=${test_data_1.TEST_USERS.member1.email}`)).toBeVisible();
    });
    test_1.test.skip("member can accept invitation", async ({ page, context }) => {
        test_1.test.skip();
    });
    test_1.test.skip("owner can add content to group", async ({ page }) => {
        test_1.test.skip();
    });
    test_1.test.skip("owner can remove content from group", async ({ page }) => {
        test_1.test.skip();
    });
    (0, test_1.test)("member cannot invite other members (permission check)", async ({ page, context, }) => {
        await page.context().clearCookies();
        await (0, test_helpers_1.loginAs)(page, test_data_1.TEST_USERS.member1.email);
        await page.goto(`/groups/${groupId || "test-group-id"}`);
        const inviteButton = page.locator('button:has-text("Invite"), button:has-text("Convidar")');
        await (0, test_1.expect)(inviteButton)
            .toBeHidden()
            .catch(() => (0, test_1.expect)(inviteButton).toBeDisabled());
    });
    test_1.test.skip("owner can delete study group", async ({ page }) => {
        groupId = await (0, test_helpers_1.createGroup)(page, "Delete Test Group");
        await page.goto(`/groups/${groupId}`);
        await page.click('button:has-text("Delete"), button:has-text("Settings")');
        await page.click('button:has-text("Confirm"), button:has-text("Confirmar")');
        await (0, test_1.expect)(page).toHaveURL(/\/groups$/);
        await (0, test_1.expect)(page.locator(`text=${test_data_1.TEST_GROUP.name}`)).toBeHidden();
    });
});
//# sourceMappingURL=group-management.spec.js.map