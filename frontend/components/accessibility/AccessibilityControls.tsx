/**
 * Accessibility Controls Component
 * 
 * Following MelhoresPraticas.txt:
 * - UI apenas, sem lógica de negócio
 * - Props para dados e callbacks
 * - WCAG 2.1 compliant
 * 
 * I3.1: Font controls
 * I3.2: Contrast modes
 * I3.3: Focus mode & reduced motion
 */

import React from 'react';
import { Type, Eye, Focus, Keyboard, Zap, RotateCcw } from 'lucide-react';
import { AccessibilitySettings } from '@/lib/accessibility/accessibility-settings';
import { toast } from 'react-hot-toast';

interface AccessibilityControlsProps {
  settings: AccessibilitySettings;
  onChange: (settings: Partial<AccessibilitySettings>) => void;
  onReset: () => void;
}

export function AccessibilityControls({
  settings,
  onChange,
  onReset
}: AccessibilityControlsProps) {
  return (
    <div className="space-y-6 p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg max-w-2xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold flex items-center gap-2 text-gray-900 dark:text-gray-100">
          <Eye className="w-5 h-5" />
          Acessibilidade
        </h2>
        <button
          onClick={onReset}
          className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
          aria-label="Restaurar padrões"
        >
          <RotateCcw className="w-4 h-4" />
          Restaurar
        </button>
      </div>

      {/* I3.1: Font Size */}
      <div>
        <label 
          htmlFor="font-size-slider"
          className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300"
        >
          <Type className="w-4 h-4 inline mr-2" />
          Tamanho da Fonte
        </label>
        <div className="flex items-center gap-4">
          <input
            id="font-size-slider"
            data-testid="font-size-slider"
            type="range"
            min="12"
            max="24"
            step="1"
            value={settings.fontSize}
            onChange={(e) => onChange({ fontSize: parseInt(e.target.value) })}
            className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
            aria-label="Tamanho da fonte"
            aria-valuemin={12}
            aria-valuemax={24}
            aria-valuenow={settings.fontSize}
            aria-valuetext={`${settings.fontSize} pixels`}
          />
          <span className="text-sm font-mono text-gray-600 dark:text-gray-400 w-12 text-right">
            {settings.fontSize}px
          </span>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          Atalho: Ctrl/Cmd + / Ctrl/Cmd -
        </p>
      </div>

      {/* Line Height */}
      <div>
        <label 
          htmlFor="line-height-slider"
          className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300"
        >
          Espaçamento entre Linhas
        </label>
        <div className="flex items-center gap-4">
          <input
            id="line-height-slider"
            type="range"
            min="1.2"
            max="2.0"
            step="0.1"
            value={settings.lineHeight}
            onChange={(e) => onChange({ lineHeight: parseFloat(e.target.value) })}
            className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
            aria-label="Espaçamento entre linhas"
            aria-valuemin={1.2}
            aria-valuemax={2.0}
            aria-valuenow={settings.lineHeight}
            aria-valuetext={`${settings.lineHeight.toFixed(1)}`}
          />
          <span className="text-sm font-mono text-gray-600 dark:text-gray-400 w-12 text-right">
            {settings.lineHeight.toFixed(1)}
          </span>
        </div>
      </div>

      {/* I3.2: Contrast */}
      <div>
        <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
          Contraste
        </label>
        <div className="flex gap-2" role="radiogroup" aria-label="Modo de contraste">
          {(['normal', 'high', 'low'] as const).map((contrast) => (
            <button
              key={contrast}
              data-testid={`contrast-${contrast}`}
              onClick={() => onChange({ contrast })}
              className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                settings.contrast === contrast
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
              }`}
              role="radio"
              aria-checked={settings.contrast === contrast}
              aria-label={`Contraste ${contrast === 'normal' ? 'normal' : contrast === 'high' ? 'alto' : 'baixo'}`}
              name={contrast === 'normal' ? 'Normal' : contrast === 'high' ? 'Alto' : 'Baixo'}
            >
              {contrast === 'normal' ? 'Normal' : contrast === 'high' ? 'Alto' : 'Baixo'}
            </button>
          ))}
        </div>
      </div>

      {/* I3.3: Focus Mode */}
      <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
        <div className="flex items-center gap-3">
          <Focus className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          <div>
            <label 
              htmlFor="focus-mode-toggle"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Modo Foco
            </label>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Reduz distrações visuais
            </p>
          </div>
        </div>
        <button
          id="focus-mode-toggle"
          data-testid="focus-mode-toggle"
          onClick={() => {
            const newValue = !settings.focusMode;
            onChange({ focusMode: newValue });
            if (newValue) {
              toast.success('Modo foco ativado');
            }
          }}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
            settings.focusMode ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
          }`}
          role="switch"
          aria-checked={settings.focusMode}
          aria-label="Alternar modo foco"
          name="modo foco"
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              settings.focusMode ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </div>

      {/* Keyboard Navigation */}
      <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
        <div className="flex items-center gap-3">
          <Keyboard className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          <div>
            <label 
              htmlFor="keyboard-nav-toggle"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Navegação por Teclado
            </label>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Atalhos e navegação via Tab
            </p>
          </div>
        </div>
        <button
          id="keyboard-nav-toggle"
          data-testid="keyboard-nav-toggle"
          onClick={() => onChange({ keyboardNavigation: !settings.keyboardNavigation })}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
            settings.keyboardNavigation ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
          }`}
          role="switch"
          aria-checked={settings.keyboardNavigation}
          aria-label="Alternar navegação por teclado"
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              settings.keyboardNavigation ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </div>

      {/* Reduced Motion */}
      <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
        <div className="flex items-center gap-3">
          <Zap className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          <div>
            <label 
              htmlFor="reduced-motion-toggle"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Reduzir Animações
            </label>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Remove transições e animações
            </p>
          </div>
        </div>
        <button
          id="reduced-motion-toggle"
          data-testid="reduced-motion-toggle"
          onClick={() => onChange({ reducedMotion: !settings.reducedMotion })}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
            settings.reducedMotion ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
          }`}
          role="switch"
          aria-checked={settings.reducedMotion}
          aria-label="Alternar redução de animações"
          name="reduzir animações"
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              settings.reducedMotion ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </div>

      {/* WCAG Info */}
      <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
        <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
          Configurações seguem WCAG 2.1 Level AA
        </p>
      </div>
    </div>
  );
}
