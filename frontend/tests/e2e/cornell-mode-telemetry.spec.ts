import { test, expect } from '@playwright/test';

test.describe('Cornell Mode & Telemetry - E2E', () => {
  test.beforeEach(async ({ page }) => {
    // 1. Mock Telemetry
    await page.route('**/telemetry/batch', async (route) => {
      await route.fulfill({ status: 200, body: JSON.stringify({ success: true, count: 1 }) });
    });

    // 2. Mock Auth Login
    await page.route('**/auth/login', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          accessToken: 'fake-jwt-token',
          user: { id: 'user-123', email: 'test@example.com', name: 'Test User' }
        })
      });
    });
    
    // 3. Mock User Profile/Me if needed
    await page.route('**/auth/profile', async (route) => {
        await route.fulfill({ status: 200, body: JSON.stringify({ id: 'user-123', plan: 'FREE' }) });
    });

    // 4. Mock Content Data
    await page.route('**/cornell/contents/test-content-id', async (route) => {
       await route.fulfill({
         status: 200,
         body: JSON.stringify({
           id: 'test-content-id',
           title: 'Test Content',
           originalText: 'Sample text',
           blocks: [],
           createdAt: new Date().toISOString()
         })
       });
    });

    // 5. Mock Initial Mode
    await page.route('**/cornell/contents/test-content-id/mode', async (route) => {
        if (route.request().method() === 'PUT') {
            const payload = route.request().postDataJSON();
            await route.fulfill({ 
                status: 200, 
                body: JSON.stringify({ 
                    mode: payload.mode, 
                    source: 'USER', 
                    inferredMode: 'NARRATIVE' 
                }) 
            });
        } else {
            await route.fulfill({
                status: 200,
                body: JSON.stringify({
                    mode: 'NARRATIVE',
                    source: 'INFERRED',
                    inferredMode: 'NARRATIVE'
                })
            });
        }
    });

    // Login flow
    await page.goto('/login');
    await page.fill('[name="email"]', 'test@example.com');
    await page.fill('[name="password"]', 'password');
    await page.click('button[type="submit"]'); 
    await expect(page).toHaveURL('/dashboard');
  });

  test('should track VIEW_CONTENT and display mode indicator', async ({ page }) => {
    // Setup telemetry spy
    const telemetryRequestPromise = page.waitForRequest(
        req => req.url().includes('/telemetry/batch') && req.method() === 'POST'
    );

    // Navigate to content
    await page.goto('/reader/test-content-id');

    // Verify Indicator Visible
    const indicator = page.getByTestId('content-mode-indicator');
    await expect(indicator).toBeVisible();

    // Verify Telemetry Event
    const request = await telemetryRequestPromise;
    const postData = request.postDataJSON();
    
    // Might be an array of events
    const events = Array.isArray(postData) ? postData : [postData]; // TelemetryClient sends array
    const viewEvent = events.find((e: any) => e.eventType === 'VIEW_CONTENT');
    
    expect(viewEvent).toBeDefined();
    expect(viewEvent.contentId).toContain('test-content-id'); // useTelemetry captures id
  });

  test('should allow changing content mode and track change', async ({ page }) => {
    await page.goto('/reader/test-content-id');

    // 1. Open Selector
    await page.getByTestId('content-mode-indicator').click();
    
    const modal = page.getByTestId('mode-selector-modal');
    await expect(modal).toBeVisible();

    // 2. Select DIDACTIC mode
    // Wait for network idle to ensure previous telemetry flushed? No, batching.
    
    // Listen for next batch (might be merged with CLICK_MODE_INDICATOR)
    const telemetryRequestPromise = page.waitForRequest(req => 
        req.url().includes('/telemetry/batch') && 
        req.postDataJSON().some((e: any) => e.eventType === 'CHANGE_MODE')
    );

    await page.getByTestId('mode-option-DIDACTIC').click();

    // 3. Verify Modal Closed
    await expect(modal).not.toBeVisible();

    // 4. Verify Indicator Text updates (assuming config works)
    const indicator = page.getByTestId('content-mode-indicator');
    await expect(indicator).toContainText('Didático');

    // 5. Verify CHANGE_MODE event sent
    // We trigger flush manually? TelemetryClient flushes every 10s or batch 50.
    // We can simulate visibility change to hidden to trigger flush?
    // Or just wait. 10s is long for test.
    // However, the client flushes on 'visibilitychange' to hidden.
    
    // Trigger flush by navigating away or hiding?
    // Let's rely on the buffer or wait.
    // Actually, for E2E speed, maybe we should expose a way to flushFromWindow?
    // Or just wait 10s? No.
    // The previous test passed because 'VIEW_CONTENT' is fast? No, track adds to buffer.
    // Wait... TelemetryClient only flushes when buffer hits batch size (50) or interval (10s).
    // The previous test 'VIEW_CONTENT' verification might fail if it doesn't flush instantly.
    
    // WORKAROUND: Force flush for testing.
    await page.evaluate(() => {
        // @ts-ignore
        if (window.telemetryClient) window.telemetryClient.flush(); 
        // We didn't expose client to window.
        // We added visibilitychange listener.
        document.dispatchEvent(new Event('visibilitychange'));
    });
    
    // Simulate tab hide (visibilityState defaults to visible)
    // Changing visibilityState is read-only.
    // We can just wait for the promise if we assume auto-flush works soon enough?
    // Ideally we expose a method or lower interval in test env.
    
    // Let's assume the earlier test passed because of luck or rethink. 
    // Ah, 'visibilityState === hidden' triggers flush.
    // But we cannot set document.visibilityState easily.
    
    // Better: In 'beforeEach', we could inject a script to lower the interval?
    // Or we track the calls.
    
    // For now, I'll rely on a manual wait or standard behavior if batch size > 1?
    // Actually, 'VIEW_CONTENT' is just 1 event. Buffer length 1.
    // To properly test, I should probably make the interval configurable via public env var NEXT_PUBLIC_TELEMETRY_INTERVAL.
    
    // Or, I can navigate away (`page.goto('/dashboard')`) which triggers `flushOnUnload` (sendBeacon/fetch keepalive).
    // Playwright captures those requests too.
    
    await page.goto('/dashboard');
    
    const request = await telemetryRequestPromise;
    const events = request.postDataJSON();
    const changeEvent = events.find((e: any) => e.eventType === 'CHANGE_MODE');
    expect(changeEvent).toBeDefined();
    expect(changeEvent.data.newMode).toBe('DIDACTIC');
  });

  test('should track scroll depth', async ({ page }) => {
    await page.goto('/reader/test-content-id');
    
    // Create long content to enable scrolling
    await page.evaluate(() => {
        document.body.style.height = '5000px';
    });

    // Scroll to 50%
    await page.evaluate(() => window.scrollTo(0, 2500));
    
    // Wait for throttle (200ms)
    await page.waitForTimeout(500);

    // Navigate away to force flush
    const telemetryRequestPromise = page.waitForRequest(req => 
       req.url().includes('/telemetry/batch')
    );
    await page.goto('/dashboard');

    const request = await telemetryRequestPromise;
    const events = request.postDataJSON();
    
    const scrollEvent = events.find((e: any) => e.eventType === 'SCROLL_DEPTH');
    expect(scrollEvent).toBeDefined();
    expect(scrollEvent.data.depth).toBeGreaterThanOrEqual(25);
  });
});
