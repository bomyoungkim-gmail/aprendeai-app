import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { ConfusionDetector } from '@/lib/heuristics/confusion-detector';
import { UIOverloadDetector } from '@/lib/heuristics/ui-overload-detector';
import { ModeConfig } from '@/lib/config/mode-config';
import { ContentMode } from '@/lib/types/content-mode';
import { useTelemetry } from '../telemetry/use-telemetry';
import { useHeuristicsStore } from '@/stores/heuristics-store';

interface UseConfusionDetectionProps {
  contentId: string;
  modeConfig: ModeConfig | null;
  mode: ContentMode;
  currentPage: number;
  activeTab: string;
}

/**
 * useConfusionDetection
 * 
 * Hook para orquestrar a detecção de Confusão e Sobrecarga de UI.
 * Integra os detectores com o HeuristicsStore e Telemetria.
 */
export function useConfusionDetection({
  contentId,
  modeConfig,
  mode,
  currentPage,
  activeTab
}: UseConfusionDetectionProps) {
  const { track } = useTelemetry(contentId);
  const { setConfusion, setUIOverload } = useHeuristicsStore();

  // Instâncias persistentes dos detectores
  const confusionDetector = useMemo(() => {
    if (!modeConfig) return null;
    return new ConfusionDetector(modeConfig, mode);
  }, [modeConfig, mode]);

  const overloadDetector = useMemo(() => new UIOverloadDetector(), []);

  // Monitorar Mudança de Página (Rereads)
  useEffect(() => {
    if (!confusionDetector) return;
    confusionDetector.recordSectionVisit(currentPage.toString());
  }, [currentPage, confusionDetector]);

  // Monitorar Troca de Painel (UI Overload)
  useEffect(() => {
    if (!overloadDetector) return;
    overloadDetector.recordPanelSwitch();
  }, [activeTab, overloadDetector]);

  // Função para registrar scroll burst externa (vinda da UI/Scroll hook)
  const onScrollBurst = useCallback(() => {
    if (confusionDetector) {
      confusionDetector.recordScrollBurst();
    }
  }, [confusionDetector]);

  // Função para registrar progresso (vinda da criação de notas/mudança de pág)
  const onProgress = useCallback(() => {
    if (overloadDetector) {
      overloadDetector.recordProgress();
    }
  }, [overloadDetector]);

  // Verificação Periódica
  useEffect(() => {
    if (!confusionDetector || !overloadDetector) return;

    const interval = setInterval(() => {
      // 1. Verificar Confusão
      const confused = confusionDetector.isConfused();
      setConfusion(confused);

      if (confused) {
        track('USER_CONFUSION_DETECTED', {
          ...confusionDetector.getMetrics(),
          mode
        });
      }

      // 2. Verificar Sobrecarga de UI
      const overloaded = overloadDetector.isOverloaded();
      const suggestion = overloaded ? overloadDetector.getSuggestion() : null;
      setUIOverload(overloaded, suggestion);

      if (overloaded) {
        track('UI_OVERLOAD_DETECTED', {
          activeTab,
          suggestion
        });
      }
    }, 5000); // Check a cada 5 segundos

    return () => clearInterval(interval);
  }, [confusionDetector, overloadDetector, setConfusion, setUIOverload, track, mode, activeTab]);

  return { 
    onScrollBurst,
    onProgress
  };
}
