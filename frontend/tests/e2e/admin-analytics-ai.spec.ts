import { test, expect } from '@playwright/test';

/**
 * E2E Test: Admin Analytics - AI Token Tracking
 * 
 * Scenario:
 * 1. Login as Student
 * 2. Use AI feature (Educator chat)
 * 3. Login as Admin
 * 4. Verify usage appears in analytics
 */

test.describe('Admin Analytics - AI Token Tracking', () => {
  const STUDENT_EMAIL = 'student@example.com';
  const STUDENT_PASSWORD = 'Student123!';
  const ADMIN_EMAIL = 'admin@example.com';
  const ADMIN_PASSWORD = 'Admin123!';

  test('should track and display AI usage in admin analytics', async ({ page, browser }) => {
    // ========================================
    // Phase 1: Student uses AI feature
    // ========================================
    
    // Login as student
    await page.goto('http://localhost:3000/login');
    await page.fill('input[name="email"]', STUDENT_EMAIL);
    await page.fill('input[name="password"]', STUDENT_PASSWORD);
    await page.click('button[type="submit"]');
    
    await expect(page).toHaveURL(/.*dashboard/);
    
    // Navigate to reading session
    await page.goto('http://localhost:3000/reader/test-content-biology');
    await expect(page.locator('[data-testid="reader-container"]')).toBeVisible();
    
    // Open AI chat (Educator Agent)
    await page.click('[data-testid="open-ai-chat"]');
    await expect(page.locator('[data-testid="ai-chat-panel"]')).toBeVisible();
    
    // Send prompt to AI
    const testPrompt = 'Explique fotossíntese de forma simples';
    await page.fill('[data-testid="ai-chat-input"]', testPrompt);
    await page.click('[data-testid="ai-chat-send"]');
    
    // Wait for AI response
    await expect(page.locator('[data-testid="ai-message"]').first()).toBeVisible({ timeout: 15000 });
    
    // Verify response is not empty
    const aiResponse = await page.locator('[data-testid="ai-message"]').first().textContent();
    expect(aiResponse).toBeTruthy();
    expect(aiResponse.length).toBeGreaterThan(10);
    
    // Logout student
    await page.click('[data-testid="user-menu"]');
    await page.click('[data-testid="logout-button"]');
    
    // ========================================
    // Phase 2: Admin verifies analytics
    // ========================================
    
    // Login as admin
    await page.goto('http://localhost:3000/login');
    await page.fill('input[name="email"]', ADMIN_EMAIL);
    await page.fill('input[name="password"]', ADMIN_PASSWORD);
    await page.click('button[type="submit"]');
    
    await expect(page).toHaveURL(/.*dashboard/);
    
    // Navigate to Admin Analytics
    await page.goto('http://localhost:3000/admin/analytics/ai');
    await expect(page.locator('h1')).toContainText(/AI Usage Analytics/i);
    
    // Verify Overview Metrics
    const totalTokensElement = page.locator('[data-testid="total-tokens"]');
    await expect(totalTokensElement).toBeVisible();
    
    const totalTokensText = await totalTokensElement.textContent();
    const totalTokens = parseInt(totalTokensText.replace(/\D/g, ''));
    expect(totalTokens).toBeGreaterThan(0); // Should have tracked tokens from student's chat
    
    // Verify Total Requests
    const totalRequestsElement = page.locator('[data-testid="total-requests"]');
    const totalRequestsText = await totalRequestsElement.textContent();
    const totalRequests = parseInt(totalRequestsText.replace(/\D/g, ''));
    expect(totalRequests).toBeGreaterThanOrEqual(1); // At least 1 request
    
    // Verify Cost Tracking
    const totalCostElement = page.locator('[data-testid="total-cost"]');
    await expect(totalCostElement).toBeVisible();
    const costText = await totalCostElement.textContent();
    expect(costText).toMatch(/\$\d+\.\d+/); // Should display cost in USD format
    
    // ========================================
    // Phase 3: Verify Distribution Chart
    // ========================================
    
    // Check feature distribution
    await page.click('[data-testid="distribution-tab"]');
    await page.selectOption('[data-testid="dimension-selector"]', 'feature');
    
    const educatorChatRow = page.locator('[data-testid="feature-educator_chat"]');
    await expect(educatorChatRow).toBeVisible();
    
    const educatorChatTokens = await educatorChatRow.locator('[data-testid="tokens"]').textContent();
    expect(parseInt(educatorChatTokens)).toBeGreaterThan(0);
    
    // ========================================
    // Phase 4: Verify Time Series Evolution
    // ========================================
    
    await page.click('[data-testid="evolution-tab"]');
    
    // Select daily interval
    await page.selectOption('[data-testid="interval-selector"]', 'day');
    
    // Verify chart is rendered
    const chart = page.locator('[data-testid="evolution-chart"]');
    await expect(chart).toBeVisible();
    
    // Verify today's data point exists
    const todayDataPoint = page.locator('[data-testid^="chart-point-2025-12-25"]');
    await expect(todayDataPoint).toBeVisible();
    
    // ========================================
    // Phase 5: Verify Top Consumers
    // ========================================
    
    await page.click('[data-testid="top-consumers-tab"]');
    await page.selectOption('[data-testid="entity-selector"]', 'user');
    
    // Verify student appears in the list
    const consumersList = page.locator('[data-testid="consumers-table"] tbody tr');
    const count = await consumersList.count();
    expect(count).toBeGreaterThanOrEqual(1);
    
    // Verify student's row has token count
    const studentRow = page.locator(`[data-testid="consumer-row"]`).filter({ hasText: STUDENT_EMAIL });
    await expect(studentRow).toBeVisible();
    
    const studentTokens = await studentRow.locator('[data-testid="tokens"]').textContent();
    expect(parseInt(studentTokens)).toBeGreaterThan(0);
  });

  test('should handle date range filtering on analytics', async ({ page }) => {
    // Login as admin
    await page.goto('http://localhost:3000/login');
    await page.fill('input[name="email"]', ADMIN_EMAIL);
    await page.fill('input[name="password"]', ADMIN_PASSWORD);
    await page.click('button[type="submit"]');
    
    await page.goto('http://localhost:3000/admin/analytics/ai');
    
    // Set date range to last 7 days
    await page.click('[data-testid="date-range-selector"]');
    await page.click('[data-testid="preset-7-days"]');
    
    // Verify data loads
    const totalTokensElement = page.locator('[data-testid="total-tokens"]');
    await expect(totalTokensElement).toBeVisible();
    
    // Change to last 30 days
    await page.click('[data-testid="date-range-selector"]');
    await page.click('[data-testid="preset-30-days"]');
    
    // Verify data reloads (loading indicator appears then disappears)
    const loadingIndicator = page.locator('[data-testid="loading-indicator"]');
    await expect(loadingIndicator).toBeVisible();
    await expect(loadingIndicator).not.toBeVisible({ timeout: 5000 });
    
    // Verify metrics are still visible after reload
    await expect(totalTokensElement).toBeVisible();
  });

  test('should display empty state when no AI usage exists', async ({ page }) => {
    // This test assumes a fresh database or filtered date range with no data
    
    // Login as admin
    await page.goto('http://localhost:3000/login');
    await page.fill('input[name="email"]', ADMIN_EMAIL);
    await page.fill('input[name="password"]', ADMIN_PASSWORD);
    await page.click('button[type="submit"]');
    
    await page.goto('http://localhost:3000/admin/analytics/ai');
    
    // Set date range to yesterday only (should have no data)
    await page.click('[data-testid="date-range-selector"]');
    
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    
    await page.fill('[data-testid="from-date"]', yesterdayStr);
    await page.fill('[data-testid="to-date"]', yesterdayStr);
    await page.click('[data-testid="apply-date-range"]');
    
    // Verify empty state
    const emptyState = page.locator('[data-testid="empty-state"]');
    await expect(emptyState).toBeVisible();
    await expect(emptyState).toContainText(/No AI usage found/i);
    
    // Verify metrics show zero
    const totalTokensElement = page.locator('[data-testid="total-tokens"]');
    const totalTokensText = await totalTokensElement.textContent();
    expect(totalTokensText).toContain('0');
  });
});
