import { Page } from '@playwright/test';

/**
 * Authentication helper for E2E tests
 * Provides login functionality for different user types
 */

export interface LoginCredentials {
  email: string;
  password: string;
}

// Test user credentials
export const TEST_USERS = {
  student: {
    email: 'student@example.com',
    password: 'Student123!',
  },
  admin: {
    email: 'admin@example.com',
    password: 'Admin123!',
  },
  teacher: {
    email: 'teacher@example.com',
    password: 'Teacher123!',
  },
};

/**
 * Login to the application
 * @param page Playwright page object
 * @param credentials User credentials
 * @returns Promise that resolves when login is complete
 */
export async function login(page: Page, credentials: LoginCredentials): Promise<void> {
  // Navigate to login page
  await page.goto('/login');
  
  // Wait for login form to be visible
  await page.waitForSelector('input[name="email"]', { timeout: 10000 });
  
  // Fill in credentials
  await page.fill('input[name="email"]', credentials.email);
  await page.fill('input[name="password"]', credentials.password);
  
  // Submit form
  await page.click('button[type="submit"]');
  
  // Wait for navigation to dashboard (successful login)
  await page.waitForURL(/.*dashboard/, { timeout: 15000 });
}

/**
 * Login as a student user
 */
export async function loginAsStudent(page: Page): Promise<void> {
  await login(page, TEST_USERS.student);
}

/**
 * Login as an admin user
 */
export async function loginAsAdmin(page: Page): Promise<void> {
  await login(page, TEST_USERS.admin);
}

/**
 * Login as a teacher user
 */
export async function loginAsTeacher(page: Page): Promise<void> {
  await login(page, TEST_USERS.teacher);
}

/**
 * Logout from the application
 */
export async function logout(page: Page): Promise<void> {
  // Click user menu
  await page.click('[data-testid="user-menu"]');
  
  // Click logout button
  await page.click('[data-testid="logout-button"]');
  
  // Wait for redirect to login page
  await page.waitForURL(/.*login/, { timeout: 10000 });
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated(page: Page): Promise<boolean> {
  try {
    // Check if we're on a protected route (not login page)
    const url = page.url();
    if (url.includes('/login')) {
      return false;
    }
    
    // Check if user menu is visible (indicates logged in state)
    const userMenu = await page.locator('[data-testid="user-menu"]').count();
    return userMenu > 0;
  } catch {
    return false;
  }
}
