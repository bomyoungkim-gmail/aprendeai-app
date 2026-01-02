/**
 * Accessibility Settings - Domain Logic
 * 
 * Following MelhoresPraticas.txt:
 * - Domain logic puro em lib/
 * - Sem dependências de framework
 * - Type-safe settings
 * - Funções puras
 * 
 * WCAG 2.1 Level AA compliance
 * I3.1: Font controls
 * I3.2: Contrast modes
 * I3.3: Focus mode & reduced motion
 */

export interface AccessibilitySettings {
  fontSize: number; // 12-24px
  lineHeight: number; // 1.2-2.0
  contrast: 'normal' | 'high' | 'low';
  focusMode: boolean;
  reducedMotion: boolean;
  keyboardNavigation: boolean;
}

export const DEFAULT_SETTINGS: AccessibilitySettings = {
  fontSize: 16,
  lineHeight: 1.5,
  contrast: 'normal',
  focusMode: false,
  reducedMotion: false,
  keyboardNavigation: true
};

/**
 * Validate and normalize settings
 */
export function validateSettings(
  settings: Partial<AccessibilitySettings>
): AccessibilitySettings {
  return {
    fontSize: Math.max(12, Math.min(24, settings.fontSize || DEFAULT_SETTINGS.fontSize)),
    lineHeight: Math.max(1.2, Math.min(2.0, settings.lineHeight || DEFAULT_SETTINGS.lineHeight)),
    contrast: settings.contrast || DEFAULT_SETTINGS.contrast,
    focusMode: settings.focusMode ?? DEFAULT_SETTINGS.focusMode,
    reducedMotion: settings.reducedMotion ?? DEFAULT_SETTINGS.reducedMotion,
    keyboardNavigation: settings.keyboardNavigation ?? DEFAULT_SETTINGS.keyboardNavigation
  };
}

/**
 * Apply settings to DOM
 * Pure function with side effects isolated
 */
export function applySettings(settings: AccessibilitySettings): void {
  const root = document.documentElement;

  // I3.1: Font size and line height
  root.style.setProperty('--base-font-size', `${settings.fontSize}px`);
  root.style.setProperty('--line-height', `${settings.lineHeight}`);

  // I3.2: Contrast mode
  root.setAttribute('data-contrast', settings.contrast);

  // I3.3: Focus mode
  root.setAttribute('data-focus-mode', settings.focusMode ? 'true' : 'false');

  // Reduced motion
  if (settings.reducedMotion) {
    root.style.setProperty('--animation-duration', '0ms');
    root.style.setProperty('--transition-duration', '0ms');
  } else {
    root.style.setProperty('--animation-duration', '200ms');
    root.style.setProperty('--transition-duration', '150ms');
  }

  // Keyboard navigation
  if (settings.keyboardNavigation) {
    root.classList.add('keyboard-navigation-enabled');
  } else {
    root.classList.remove('keyboard-navigation-enabled');
  }
}

/**
 * Get contrast ratio for WCAG compliance
 */
export function getContrastRatio(foreground: string, background: string): number {
  // Simplified contrast ratio calculation
  // In production, use a proper color contrast library
  const getLuminance = (hex: string): number => {
    const rgb = parseInt(hex.slice(1), 16);
    const r = (rgb >> 16) & 0xff;
    const g = (rgb >> 8) & 0xff;
    const b = (rgb >> 0) & 0xff;
    
    const [rs, gs, bs] = [r, g, b].map(c => {
      c = c / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    
    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
  };

  const l1 = getLuminance(foreground);
  const l2 = getLuminance(background);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);

  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Check if settings meet WCAG AA standards
 */
export function isWCAGCompliant(settings: AccessibilitySettings): {
  compliant: boolean;
  issues: string[];
} {
  const issues: string[] = [];

  // Font size minimum (WCAG 1.4.4)
  if (settings.fontSize < 14) {
    issues.push('Font size below recommended minimum (14px)');
  }

  // Line height minimum (WCAG 1.4.12)
  if (settings.lineHeight < 1.5) {
    issues.push('Line height below recommended minimum (1.5)');
  }

  return {
    compliant: issues.length === 0,
    issues
  };
}

/**
 * Serialize settings to localStorage format
 */
export function serializeSettings(settings: AccessibilitySettings): string {
  return JSON.stringify(settings);
}

/**
 * Deserialize settings from localStorage
 */
export function deserializeSettings(data: string): AccessibilitySettings {
  try {
    const parsed = JSON.parse(data);
    return validateSettings(parsed);
  } catch {
    return DEFAULT_SETTINGS;
  }
}
