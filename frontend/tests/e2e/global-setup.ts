import { chromium, FullConfig } from '@playwright/test';
import path from 'path';
import fs from 'fs';

/**
 * Global Setup for Playwright Tests
 * 
 * Performs authentication once and saves the state for reuse across all tests.
 * This significantly improves test performance and reliability.
 * 
 * Best practices from:
 * - https://playwright.dev/docs/auth
 * - https://codeautomationlab.com/playwright-authentication-best-practices
 */

async function globalSetup(config: FullConfig) {
  const { baseURL } = config.projects[0].use;
  const authFile = path.join(__dirname, '../../playwright/.auth/user.json');

  // Ensure auth directory exists
  const authDir = path.dirname(authFile);
  if (!fs.existsSync(authDir)) {
    fs.mkdirSync(authDir, { recursive: true });
  }

  console.log('🔐 Setting up authentication...');

  const browser = await chromium.launch();
  const context = await browser.newContext({
    baseURL,
  });
  const page = await context.newPage();

  try {
    // Try real login first
    console.log(`Attempting login at ${baseURL}/login...`);
    await page.goto(`${baseURL}/login`, { timeout: 10000 });
    
    // Wait for login form
    await page.waitForSelector('input[name="email"]', { timeout: 10000 });
    
    // Fill credentials
    await page.fill('input[name="email"]', 'student@example.com');
    await page.fill('input[name="password"]', 'Student123!');
    
    // Submit
    await page.click('button[type="submit"]');
    
    // Wait for successful login (redirect to dashboard)
    await page.waitForURL(/.*dashboard/, { timeout: 15000 });
    
    console.log('✅ Real login successful');

  } catch (loginError) {
    console.warn('⚠️  Real login failed, creating mock authentication state...');
    console.warn('Error:', loginError instanceof Error ? loginError.message : loginError);
    
    // Create a mock authenticated state
    // This allows tests to run even without a real backend
    await context.addCookies([
      {
        name: 'auth-token',
        value: 'mock-e2e-test-token',
        domain: '127.0.0.1',
        path: '/',
        httpOnly: true,
        secure: false,
        sameSite: 'Lax',
        expires: Date.now() / 1000 + 86400, // 24 hours
      }
    ]);

    // Navigate to a page to establish the session
    try {
      await page.goto(`${baseURL}/dashboard`, { waitUntil: 'domcontentloaded', timeout: 5000 });
    } catch {
      // Ignore navigation errors in mock mode
    }
  }

  // Save authentication state (real or mocked)
  await context.storageState({ path: authFile });
  console.log(`💾 Authentication state saved to ${authFile}`);

  await context.close();
  await browser.close();
}

export default globalSetup;
