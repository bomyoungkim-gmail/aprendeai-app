/**
 * Accessibility Hook
 * 
 * Following MelhoresPraticas.txt:
 * - Hooks em hooks/ para orquestração
 * - Gerencia React state e side effects
 * - Usa domain logic puro
 * - Persiste em localStorage
 * 
 * I3.1-I3.3: Manages accessibility settings
 */

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import {
  AccessibilitySettings,
  DEFAULT_SETTINGS,
  validateSettings,
  applySettings,
  serializeSettings,
  deserializeSettings,
  isWCAGCompliant
} from '@/lib/accessibility/accessibility-settings';

const STORAGE_KEY = 'cornell-accessibility-settings';

export function useAccessibility() {
  const [settings, setSettings] = useState<AccessibilitySettings>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);

  // Load settings from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const loaded = deserializeSettings(stored);
        setSettings(loaded);
        applySettings(loaded);
      } else {
        applySettings(DEFAULT_SETTINGS);
      }
    } catch (error) {
      console.error('Failed to load accessibility settings:', error);
      toast.error('Erro ao carregar configurações de acessibilidade');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Update settings
  const updateSettings = useCallback((partial: Partial<AccessibilitySettings>) => {
    setSettings(current => {
      const updated = validateSettings({ ...current, ...partial });
      
      // Apply to DOM
      applySettings(updated);
      
      // Persist to localStorage
      try {
        localStorage.setItem(STORAGE_KEY, serializeSettings(updated));
      } catch (error) {
        console.error('Failed to save accessibility settings:', error);
        toast.error('Erro ao salvar configurações');
      }

      // Check WCAG compliance
      const { compliant, issues } = isWCAGCompliant(updated);
      if (!compliant && issues.length > 0) {
        console.warn('WCAG compliance issues:', issues);
      }

      return updated;
    });
  }, []);

  // Reset to defaults
  const resetSettings = useCallback(() => {
    setSettings(DEFAULT_SETTINGS);
    applySettings(DEFAULT_SETTINGS);
    
    try {
      localStorage.removeItem(STORAGE_KEY);
      toast.success('Configurações restauradas ao padrão');
    } catch (error) {
      console.error('Failed to reset settings:', error);
    }
  }, []);

  // Increase font size
  const increaseFontSize = useCallback(() => {
    updateSettings({ fontSize: Math.min(24, settings.fontSize + 2) });
  }, [settings.fontSize, updateSettings]);

  // Decrease font size
  const decreaseFontSize = useCallback(() => {
    updateSettings({ fontSize: Math.max(12, settings.fontSize - 2) });
  }, [settings.fontSize, updateSettings]);

  // Toggle focus mode
  const toggleFocusMode = useCallback(() => {
    updateSettings({ focusMode: !settings.focusMode });
    toast.info(settings.focusMode ? 'Modo foco desativado' : 'Modo foco ativado');
  }, [settings.focusMode, updateSettings]);

  // Toggle reduced motion
  const toggleReducedMotion = useCallback(() => {
    updateSettings({ reducedMotion: !settings.reducedMotion });
  }, [settings.reducedMotion, updateSettings]);

  // Keyboard shortcuts
  useEffect(() => {
    if (!settings.keyboardNavigation) return;

    const handleKeyPress = (e: KeyboardEvent) => {
      // Ctrl/Cmd + Plus: Increase font
      if ((e.ctrlKey || e.metaKey) && e.key === '=') {
        e.preventDefault();
        increaseFontSize();
      }
      
      // Ctrl/Cmd + Minus: Decrease font
      if ((e.ctrlKey || e.metaKey) && e.key === '-') {
        e.preventDefault();
        decreaseFontSize();
      }

      // Ctrl/Cmd + 0: Reset font
      if ((e.ctrlKey || e.metaKey) && e.key === '0') {
        e.preventDefault();
        updateSettings({ fontSize: DEFAULT_SETTINGS.fontSize });
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [settings.keyboardNavigation, increaseFontSize, decreaseFontSize, updateSettings]);

  return {
    settings,
    isLoading,
    updateSettings,
    resetSettings,
    increaseFontSize,
    decreaseFontSize,
    toggleFocusMode,
    toggleReducedMotion
  };
}
