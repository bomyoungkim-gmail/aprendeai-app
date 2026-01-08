/**
 * Analytics Page Object
 * 
 * Page Object Model for analytics dashboard
 */

import { Page, expect } from '@playwright/test';

export class AnalyticsPage {
  constructor(private page: Page) {}

  // Navigation
  async goto() {
    await this.page.goto('/analytics');
    await this.page.waitForLoadState('networkidle');
  }

  // KPIs
  async getKPIValue(kpiName: string): Promise<string> {
    const kpi = this.page.locator(`[data-kpi="${kpiName}"]`);
    return await kpi.textContent() || '';
  }

  async areKPIsVisible(): Promise<boolean> {
    const kpis = this.page.locator('[data-kpi]');
    return await kpis.first().isVisible();
  }

  // Date Range Filter
  async selectDateRange(range: 'week' | 'month' | 'year') {
    await this.page.getByRole('button', { name: new RegExp(range, 'i') }).click();
    await this.page.waitForTimeout(500); // Wait for data reload
  }

  // Export
  async exportToCSV() {
    const downloadPromise = this.page.waitForEvent('download');
    await this.page.getByRole('button', { name: /export|csv/i }).click();
    const download = await downloadPromise;
    return download;
  }

  // Confusion Heatmap
  async isConfusionHeatmapVisible(): Promise<boolean> {
    const heatmap = this.page.locator('[data-chart="confusion-heatmap"]');
    return await heatmap.isVisible();
  }

  async getHeatmapColors(): Promise<string[]> {
    const cells = this.page.locator('[data-chart="confusion-heatmap"] [data-color]');
    const count = await cells.count();
    const colors: string[] = [];
    
    for (let i = 0; i < count; i++) {
      const color = await cells.nth(i).getAttribute('data-color');
      if (color) colors.push(color);
    }
    
    return colors;
  }

  // Assertions
  async expectKPIsToBeVisible() {
    await expect(this.page.locator('[data-kpi]').first()).toBeVisible();
  }

  async expectConfusionHeatmapToBeVisible() {
    await expect(this.page.locator('[data-chart="confusion-heatmap"]')).toBeVisible();
  }
}
