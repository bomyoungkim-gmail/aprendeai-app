/**
 * Scientific Reader Page Object
 * 
 * Page Object Model for SCIENTIFIC reading mode
 */

import { Page, expect } from '@playwright/test';

export class ScientificReaderPage {
  constructor(private page: Page) {}

  // Navigation
  async goto() {
    await this.page.goto('/reader/scientific-article?mode=SCIENTIFIC');
    await this.page.waitForLoadState('networkidle');
  }

  // Glossary
  async clickGlossaryTerm(term: string) {
    await this.page.getByTestId(`glossary-term-${term}`).click();
    await this.page.waitForTimeout(500); // Wait for popover animation
  }

  async isGlossaryPopoverVisible(): Promise<boolean> {
    const popover = this.page.locator('[data-testid^="glossary-popover"]').first();
    return await popover.isVisible();
  }

  async getGlossaryPopoverHeading(): Promise<string> {
    const heading = this.page.getByRole('heading').first();
    return await heading.textContent() || '';
  }

  async isGlossaryLoading(): Promise<boolean> {
    const loadingElement = this.page.locator('.animate-pulse');
    return await loadingElement.isVisible();
  }

  async closeGlossaryPopover() {
    await this.page.getByTestId('glossary-popover-close').click();
    await this.page.waitForTimeout(300);
  }

  async waitForGlossaryDefinition(timeout = 5000) {
    await this.page.waitForSelector('text=/fonte:/i', { timeout });
  }

  // IMRaD Filters
  async clickIMRaDFilter(section: 'abstract' | 'introduction' | 'methods' | 'results' | 'discussion') {
    await this.page.getByTestId(`imrad-filter-${section}`).click();
    await this.page.waitForTimeout(300);
  }

  async getAnnotationCount(section?: string): Promise<number> {
    if (section) {
      const button = this.page.getByTestId(`imrad-filter-${section.toLowerCase()}`);
      const text = await button.textContent();
      const match = text?.match(/(\d+)/);
      return match ? parseInt(match[1]) : 0;
    }
    
    // Get total count
    const countText = await this.page.locator('text=/\\d+ annotations/i').textContent();
    const match = countText?.match(/(\d+)/);
    return match ? parseInt(match[1]) : 0;
  }

  async getVisibleAnnotations(): Promise<number> {
    const annotations = this.page.locator('[data-annotation]');
    return await annotations.count();
  }

  // Assertions
  async expectGlossaryPopoverToBeVisible() {
    await expect(this.page.locator('[data-testid^="glossary-popover"]').first()).toBeVisible();
  }

  async expectGlossaryPopoverToBeHidden() {
    await expect(this.page.locator('[data-testid^="glossary-popover"]').first()).not.toBeVisible();
  }

  async expectAnnotationCountToBe(section: string, count: number) {
    const actualCount = await this.getAnnotationCount(section);
    expect(actualCount).toBe(count);
  }
}
