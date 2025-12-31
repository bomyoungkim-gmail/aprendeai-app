import { Page } from "@playwright/test";
export declare function loginAs(page: Page, email: string, password?: string): Promise<void>;
export declare function logout(page: Page): Promise<void>;
export declare function createGroup(page: Page, name: string): Promise<string>;
export declare function uploadContent(page: Page, filePath: string, title: string): Promise<void>;
export declare function createSession(page: Page, groupId: string, contentId: string): Promise<string>;
export declare function waitForWebSocketConnection(page: Page, timeout?: number): Promise<void>;
export declare function cleanupTestData(page: Page, options: {
    groupIds?: string[];
    contentIds?: string[];
}): Promise<void>;
export declare function generateTestEmail(): string;
export declare function waitForText(page: Page, text: string, timeout?: number): Promise<void>;
