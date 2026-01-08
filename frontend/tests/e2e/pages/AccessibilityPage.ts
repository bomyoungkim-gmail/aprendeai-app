/**
 * Accessibility Page Object
 * 
 * Page Object Model for accessibility settings page
 * Makes tests more maintainable and readable
 */

import { Page, expect } from '@playwright/test';

export class AccessibilityPage {
  constructor(private page: Page) {}

  // Navigation
  async goto() {
    await this.page.goto('/settings/accessibility');
    await this.page.waitForLoadState('networkidle');
  }

  // Font Size Controls
  async getFontSize(): Promise<string> {
    // Get value from the slider
    const slider = this.page.getByTestId('font-size-slider');
    const value = await slider.inputValue();
    return `${value}px`;
  }

  async setFontSize(size: number) {
    await this.page.getByTestId('font-size-slider').fill(size.toString());
    await this.page.waitForTimeout(500); // Wait for CSS var to update
  }

  async increaseFontSizeWithKeyboard() {
    await this.page.keyboard.press('Control+=');
    await this.page.waitForTimeout(300);
  }

  async decreaseFontSizeWithKeyboard() {
    await this.page.keyboard.press('Control+-');
    await this.page.waitForTimeout(300);
  }

  // Contrast Controls
  async setContrast(mode: 'normal' | 'high' | 'low') {
    await this.page.getByTestId(`contrast-${mode}`).click();
    await this.page.waitForTimeout(300);
  }

  async getContrastMode(): Promise<string> {
    const normalButton = this.page.getByTestId('contrast-normal');
    const highButton = this.page.getByTestId('contrast-high');
    const lowButton = this.page.getByTestId('contrast-low');

    if (await normalButton.getAttribute('aria-checked') === 'true') return 'normal';
    if (await highButton.getAttribute('aria-checked') === 'true') return 'high';
    if (await lowButton.getAttribute('aria-checked') === 'true') return 'low';
    
    return 'unknown';
  }

  // Focus Mode
  async toggleFocusMode() {
    await this.page.getByTestId('focus-mode-toggle').click();
    await this.page.waitForTimeout(300);
  }

  async isFocusModeEnabled(): Promise<boolean> {
    const toggle = this.page.getByTestId('focus-mode-toggle');
    return await toggle.getAttribute('aria-checked') === 'true';
  }

  // Keyboard Navigation
  async toggleKeyboardNavigation() {
    await this.page.getByTestId('keyboard-nav-toggle').click();
    await this.page.waitForTimeout(300);
  }

  async isKeyboardNavigationEnabled(): Promise<boolean> {
    const toggle = this.page.getByTestId('keyboard-nav-toggle');
    return await toggle.getAttribute('aria-checked') === 'true';
  }

  // Reduced Motion
  async toggleReducedMotion() {
    await this.page.getByTestId('reduced-motion-toggle').click();
    await this.page.waitForTimeout(300);
  }

  async isReducedMotionEnabled(): Promise<boolean> {
    const toggle = this.page.getByTestId('reduced-motion-toggle');
    return await toggle.getAttribute('aria-checked') === 'true';
  }

  // Persistence Check
  async verifySettingsPersisted(expectedSettings: {
    fontSize?: number;
    contrast?: string;
    focusMode?: boolean;
    reducedMotion?: boolean;
  }) {
    // Reload page
    await this.page.reload();
    await this.page.waitForLoadState('networkidle');

    // Verify each setting
    if (expectedSettings.fontSize) {
      const fontSize = await this.getFontSize();
      expect(fontSize).toBe(`${expectedSettings.fontSize}px`);
    }

    if (expectedSettings.contrast) {
      const contrast = await this.getContrastMode();
      expect(contrast).toBe(expectedSettings.contrast);
    }

    if (expectedSettings.focusMode !== undefined) {
      const focusMode = await this.isFocusModeEnabled();
      expect(focusMode).toBe(expectedSettings.focusMode);
    }

    if (expectedSettings.reducedMotion !== undefined) {
      const reducedMotion = await this.isReducedMotionEnabled();
      expect(reducedMotion).toBe(expectedSettings.reducedMotion);
    }
  }
}
