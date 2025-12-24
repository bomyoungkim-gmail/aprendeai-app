import { test, expect } from '@playwright/test';

test.describe('Platform Navigation UX', () => {

  test('should allow new user registration', async ({ page }) => {
    // Mock API to avoid Backend SMTP timeout
    await page.route('**/auth/register', async route => {
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          access_token: 'mock-jwt-token',
          user: {
            id: 'mock-id',
            email: 'mock@example.com',
            name: 'Mock User'
          }
        })
      });
    });

    // Generate unique email to avoid conflict
    const timestamp = Date.now();
    const uniqueEmail = `ux-new-${timestamp}@example.com`;
    const password = 'Password123!';

    // 1. Start at Login
    await page.goto('/login');
    
    // 2. Navigate to Registration
    await page.click('text=Registre-se');
    await expect(page).toHaveURL('/register');

    // 3. Fill Form
    // Using IDs as RegisterPage doesn't use data-testid
    await page.fill('#name', 'New UX User');
    await page.fill('#email', uniqueEmail);
    await page.fill('#password', password);
    await page.fill('#confirmPassword', password);

    // 4. Submit
    await page.click('button[type="submit"]');

    // 5. Expect Redirect to Dashboard (New user flow)
    await page.waitForURL('/dashboard');
    
    // Verify Dashboard Sidebar is visible
    await expect(page.getByText('Início')).toBeVisible();
    await expect(page.getByText('AprendeAI')).toBeVisible();
  });

  test('should have easily available navigation buttons', async ({ page }) => {
    // 1. Login with seeded user
    await page.goto('/login');
    await page.fill('[data-testid="email"]', 'test@example.com');
    await page.fill('[data-testid="password"]', 'password123');
    await page.click('[data-testid="login-btn"]');
    await page.waitForURL('/dashboard');

    // 2. Verify all major nav items are clicking and working
    const navLinks = [
      { text: 'Biblioteca', url: '/dashboard/library' },
      { text: 'Progresso', url: '/dashboard/progress' },
      { text: 'Início', url: '/dashboard' } // Move back to dashboard last
    ];

    for (const link of navLinks) {
       console.log(`Navigating to ${link.text}`);
       // Locate logic matches "DashboardSidebar.tsx" mapping
       await page.click(`text=${link.text}`);
       await expect(page).toHaveURL(new RegExp(link.url));
       
       // Verify header or content existence to ensure page load
       // Using generic checks as pages might be empty in seed
       // But Navigation should work.
    }
  });

  test('should support browser back and forward navigation', async ({ page }) => {
    // 1. Login
    await page.goto('/login');
    await page.fill('[data-testid="email"]', 'test@example.com');
    await page.fill('[data-testid="password"]', 'password123');
    await page.click('[data-testid="login-btn"]');
    await page.waitForURL('/dashboard');

    // 2. Navigate Dashboard -> Settings
    await page.click('text=Configurações'); // Settings
    await expect(page).toHaveURL('/settings');

    // 3. Navigate Settings -> Library
    await page.click('text=Biblioteca');
    await expect(page).toHaveURL('/dashboard/library');

    // 4. Browser Back -> Should be Settings
    console.log('Testing Go Back');
    await page.goBack();
    await expect(page).toHaveURL('/settings');

    // 5. Browser Back -> Should be Dashboard
    await page.goBack();
    await expect(page).toHaveURL('/dashboard');

    // 6. Browser Forward -> Should be Settings
    console.log('Testing Go Forward');
    await page.goForward();
    await expect(page).toHaveURL('/settings');
  });

});
