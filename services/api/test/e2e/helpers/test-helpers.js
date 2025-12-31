"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loginAs = loginAs;
exports.logout = logout;
exports.createGroup = createGroup;
exports.uploadContent = uploadContent;
exports.createSession = createSession;
exports.waitForWebSocketConnection = waitForWebSocketConnection;
exports.cleanupTestData = cleanupTestData;
exports.generateTestEmail = generateTestEmail;
exports.waitForText = waitForText;
async function loginAs(page, email, password = "Test123!@#") {
    await page.goto("/login");
    await page.fill('input[name="email"], input[type="email"]', email);
    await page.fill('input[name="password"], input[type="password"]', password);
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/(dashboard|groups)/, { timeout: 10000 });
}
async function logout(page) {
    await page.click('[aria-label="User menu"], button:has-text("Logout"), a:has-text("Sair")');
    await page.waitForURL("/login");
}
async function createGroup(page, name) {
    var _a;
    await page.goto("/groups");
    await page.click('button:has-text("Create Group"), button:has-text("Criar Grupo")');
    await page.fill('input[name="name"]', name);
    await page.click('button[type="submit"], button:has-text("Create"), button:has-text("Criar")');
    await page.waitForURL(/\/groups\/[a-f0-9-]+/);
    const url = page.url();
    const groupId = (_a = url.match(/\/groups\/([a-f0-9-]+)/)) === null || _a === void 0 ? void 0 : _a[1];
    if (!groupId)
        throw new Error("Failed to extract group ID");
    return groupId;
}
async function uploadContent(page, filePath, title) {
    var _a;
    await page.goto("/dashboard");
    await page.click('button:has-text("Upload"), button:has-text("Fazer Upload")');
    const fileInput = await page.locator('input[type="file"]');
    await fileInput.setInputFiles(filePath);
    await page.waitForSelector("text=" + ((_a = filePath.split(/[\\/]/).pop()) === null || _a === void 0 ? void 0 : _a.substring(0, 20)) || "test");
    await page.fill('input[name="title"]', title);
    await page.click('button:has-text("Upload"), button:has-text("Fazer Upload"):not(:disabled)');
    await page.waitForSelector('button:has-text("Fazer Upload")', {
        state: "hidden",
        timeout: 15000,
    });
}
async function createSession(page, groupId, contentId) {
    var _a;
    await page.goto(`/groups/${groupId}`);
    await page.click('button:has-text("Create Session"), button:has-text("Nova Sessão")');
    await page.click(`[data-content-id="${contentId}"], li:has-text("Test Content")`);
    await page.selectOption('select[name="mode"]', "PI_SPRINT");
    await page.fill('input[name="roundsCount"]', "2");
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/sessions\/[a-f0-9-]+/);
    const url = page.url();
    const sessionId = (_a = url.match(/\/sessions\/([a-f0-9-]+)/)) === null || _a === void 0 ? void 0 : _a[1];
    if (!sessionId)
        throw new Error("Failed to extract session ID");
    return sessionId;
}
async function waitForWebSocketConnection(page, timeout = 5000) {
    await page.waitForSelector('[data-ws-status="connected"], text=/Live|Conectado/i', { timeout });
}
async function cleanupTestData(page, options) {
    if (options.groupIds) {
        for (const groupId of options.groupIds) {
            try {
                await page.request.delete(`http://localhost:8000/groups/${groupId}`);
            }
            catch (e) {
                console.warn(`Failed to delete group ${groupId}:`, e);
            }
        }
    }
}
function generateTestEmail() {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(7);
    return `test-${timestamp}-${random}@example.com`;
}
async function waitForText(page, text, timeout = 5000) {
    await page.waitForSelector(`text=${text}`, { timeout });
}
//# sourceMappingURL=test-helpers.js.map