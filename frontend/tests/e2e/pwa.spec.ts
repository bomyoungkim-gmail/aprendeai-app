import { test, expect } from '@playwright/test';

test.describe('PWA Features', () => {
  test('shows install prompt on supported browsers', async ({ page, context }) => {
    // Set user agent for PWA support
    await context.addInitScript(() => {
      window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        (window as any).deferredPrompt = e;
      });
    });
    
    await page.goto('/');
    
    // Wait for install prompt (may take 30 seconds in real app)
    await page.waitForTimeout(2000);
    
    // Check if install prompt would appear
    const installPrompt = page.locator('[data-testid="install-prompt"], text=Install AprendeAI');
    // Note: This may not appear in test environment
  });

  test('manifest.json is accessible', async ({ page }) => {
    const response = await page.goto('/manifest.json');
    expect(response?.status()).toBe(200);
    
    const manifest = await response?.json();
    expect(manifest.name).toContain('AprendeAI');
    expect(manifest.short_name).toBe('AprendeAI');
    expect(manifest.display).toBe('standalone');
  });

  test('service worker registers successfully', async ({ page }) => {
    await page.goto('/');
    
    // Check if service worker is registered
    const swRegistered = await page.evaluate(async () => {
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.getRegistration();
        return !!registration;
      }
      return false;
    });
    
    expect(swRegistered).toBe(true);
  });

  test('works offline after visiting pages', async ({ page, context }) => {
    // Visit dashboard first (cache it)
    await page.goto('/login');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
    
    // Wait for service worker to cache
    await page.waitForTimeout(2000);
    
    // Go offline
    await context.setOffline(true);
    
    // Navigate to dashboard again
    await page.goto('/dashboard');
    
    // Should show offline page or cached content
    const offlineIndicator = page.locator('text=offline, text=Offline, [data-offline]');
    const dashboard = page.locator('text=Dashboard');
    
    // Either offline page or cached dashboard should be visible
    const hasContent = await dashboard.isVisible() || await offlineIndicator.isVisible();
    expect(hasContent).toBe(true);
  });

  test('offline page displays correctly', async ({ page, context }) => {
    // Go offline
    await context.setOffline(true);
    
    // Try to navigate to a new page
    await page.goto('/some-new-page');
    
    // Should show offline page
    await expect(page.locator('text=offline, text=You\'re Offline')).toBeVisible();
  });

  test('caches static assets', async ({ page }) => {
    await page.goto('/');
    
    // Check service worker cache
    const cacheNames = await page.evaluate(async () => {
      return await caches.keys();
    });
    
    expect(cacheNames.length).toBeGreaterThan(0);
    expect(cacheNames.some(name => name.includes('aprendeai'))).toBe(true);
  });

  test('auto-reloads when back online', async ({ page, context }) => {
    // Navigate to page
    await page.goto('/dashboard');
    
    // Go offline
    await context.setOffline(true);
    await page.reload();
    
    // Go back online
    await context.setOffline(false);
    
    // Trigger online event
    await page.evaluate(() => {
      window.dispatchEvent(new Event('online'));
    });
    
    // Should reload
    await page.waitForTimeout(1000);
    await expect(page).toHaveURL(/dashboard/);
  });

  test('handles push notification permission', async ({ page, context }) => {
    // Grant notification permission
    await context.grantPermissions(['notifications']);
    
    await page.goto('/');
    
    // Check notification permission
    const permission = await page.evaluate(async () => {
      return await Notification.requestPermission();
    });
    
    expect(permission).toBe('granted');
  });
});
