import { test, expect } from '@playwright/test';

test.describe('Sprint 2: UX Core & Analytics E2E', () => {
    
    // --- Setup Mocks ---
    test.beforeEach(async ({ page }) => {
        // Mock Auth
        await page.route('**/auth/login', async (route) => {
            await route.fulfill({
                status: 200,
                body: JSON.stringify({
                    access_token: 'fake-jwt',
                    user: { 
                        id: 'user-1', 
                        email: 'test@example.com', 
                        name: 'Tester',
                        system_role: 'STUDENT',
                        role: 'STUDENT'
                    }
                })
            });
        });

        // Mock Content
        await page.route('**/cornell/contents/demo-content', async (route) => {
           await route.fulfill({
               status: 200,
               body: JSON.stringify({
                   id: 'demo-content',
                   title: 'Demo Article',
                   originalText: 'This is a sample text for testing undo redo behaviors.',
                   metadata: { mode: 'NARRATIVE' }
               })
           });
        });

        // Mock Analytics Session
         await page.route('**/analytics/session/demo-content', async (route) => {
            await route.fulfill({
                status: 200,
                body: JSON.stringify({
                    sessionId: 'sess-1',
                    totalTimeMs: 65000,
                    scrollDepth: 45,
                    highlightsCount: 5,
                    notesCount: 2,
                    dominantMode: 'NARRATIVE',
                    startTime: new Date().toISOString(),
                    endTime: new Date().toISOString()
                })
            });
         });

        // INJECT AUTH STATE (Bypass Login UI flakiness)
        await page.addInitScript(() => {
            window.localStorage.setItem('auth-storage', JSON.stringify({
                state: {
                    token: 'fake-jwt',
                    user: { 
                        id: 'user-1', 
                        email: 'test@example.com', 
                        name: 'Tester',
                        systemRole: 'STUDENT',
                        role: 'STUDENT'
                    },
                    _hasHydrated: true
                },
                version: 0
            }));
        });

        // Go directly to Dashboard (should be allowed now)
        await page.goto('/dashboard');
    });

    // --- Test 1: Adaptive UI (Auto-Hide) ---
    test('UI should handle visibility toggling', async ({ page }) => {
        await page.goto('/reader/demo-content');
        
        // Ensure we are on the reader page
        await expect(page).toHaveURL(/\/reader\/demo-content/);

        // Header initially visible
        const header = page.locator('header');
        await expect(header).toBeVisible({ timeout: 10000 });
        await expect(header).toHaveClass(/translate-y-0/);

        // Click content to toggle (hide)
        // Ensure we click an area that isn't selecting text
        await page.locator('.flex-1.overflow-hidden').click({ position: { x: 100, y: 100 } });
        
        // Wait for transition
        await page.waitForTimeout(400); 

        // Check if hidden class is applied corresponding to -translate-y-full
        await expect(header).toHaveClass(/-translate-y-full/);
    });

    // --- Test 2: Undo/Redo ---
    test('Undo/Redo should revert actions', async ({ page }) => {
        await page.goto('/reader/demo-content');

        // Simulate highlighting text (mocked via UI interaction if complex, or invoking internal method if possible)
        // Since drag-to-select is hard in playwright without precise coords, we might simulate the effect or trigger the toolbar
        // Actually, ModernCornellLayout has `onCreateStreamItem`.
        
        // Let's rely on the "Note" creation which is easier? Or just a button if we had one.
        // We implemented Keyboard shortcuts.
        
        // Workaround: Monitor the "Stream" tab count or items.
        // Assuming we can type a note in the sidebar.
        
        // Open Stream Tab
        await page.click('button:has-text("Vocabulário")'); // Updated from "Notas"
        
        // Add a Note
        await page.fill('[placeholder="Adicionar nota..."]', 'Test Note 1');
        await page.keyboard.press('Enter');
        
        // check it appears
        await expect(page.getByText('Test Note 1')).toBeVisible();

        // UNDO (Ctrl+Z)
        await page.keyboard.down('Control');
        await page.keyboard.press('z');
        await page.keyboard.up('Control');

        // Check it disappears
        await expect(page.getByText('Test Note 1')).not.toBeVisible();

        // REDO (Ctrl+Shift+Z)
        await page.keyboard.down('Control');
        await page.keyboard.down('Shift');
        await page.keyboard.press('z');
        await page.keyboard.up('Shift');
        await page.keyboard.up('Control');

        // Check it reappears
        await expect(page.getByText('Test Note 1')).toBeVisible();
    });

    // --- Test 3: Analytics Dashboard ---
    test('Analytics Dashboard should render metrics', async ({ page }) => {
        await page.goto('/reader/demo-content');

        // Switch to Analytics Tab
        await page.click('button:has-text("Analíticos")');

        // Check Metrics from Mock
        await expect(page.getByText('65000')).toBeHidden(); // Should be formatted as minutes
        await expect(page.getByText('1 min')).toBeVisible(); // 65000ms ~= 1 min
        
        await expect(page.getByText('45%')).toBeVisible(); // Depth
        await expect(page.getByText('Evidência')).toBeVisible();
        await expect(page.getByText('5', { exact: true })).toBeVisible(); // Highlight count
    });

});
