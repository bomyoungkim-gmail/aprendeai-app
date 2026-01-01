import { useState, useEffect, useRef, useMemo } from 'react';
import { FlowDetector } from '@/lib/heuristics/flow-detector';
import { ModeConfig } from '@/lib/config/mode-config';
import { useTelemetry } from '../telemetry/use-telemetry';

interface UseFlowDetectionProps {
  contentId: string;
  modeConfig: ModeConfig | null;
  currentPage: number;
  isUiVisible: boolean;
}

/**
 * useFlowDetection
 * 
 * Hook para orquestrar a detecção de Flow.
 * Integra a lógica do FlowDetector com o ciclo de vida do React e Telemetria.
 */
export function useFlowDetection({ 
  contentId, 
  modeConfig, 
  currentPage, 
  isUiVisible 
}: UseFlowDetectionProps) {
  const { track } = useTelemetry(contentId);
  const [isInFlow, setIsInFlow] = useState(false);
  
  // Instância persistente da heurística (Domain Logic)
  const detector = useMemo(() => {
    if (!modeConfig) return null;
    return new FlowDetector(modeConfig);
  }, [modeConfig]);

  // Tracking de tempo por página
  const lastPageRef = useRef(currentPage);
  const entryTimeRef = useRef(Date.now());

  // Sincronizar config se o modo mudar
  useEffect(() => {
    if (detector && modeConfig) {
      detector.updateConfig(modeConfig);
    }
  }, [detector, modeConfig]);

  // Monitorar Mudança de Página (Dwell Time)
  useEffect(() => {
    if (!detector) return;

    if (currentPage !== lastPageRef.current) {
      const now = Date.now();
      const timeSpent = now - entryTimeRef.current;
      
      // Apenas registra dwell times relevantes (evita saltos rápidos/navegação)
      if (timeSpent > 1000) {
        detector.addDwellTime(timeSpent);
      }

      lastPageRef.current = currentPage;
      entryTimeRef.current = now;
    }
  }, [currentPage, detector]);

  // Monitorar Toggles de UI
  useEffect(() => {
    if (!detector) return;
    detector.recordUIToggle();
  }, [isUiVisible, detector]);

  // Verificação Periódica (Polling do estado da heurística)
  useEffect(() => {
    if (!detector || !modeConfig) return;

    const interval = setInterval(() => {
      const currentFlow = detector.isInFlow();
      
      if (currentFlow !== isInFlow) {
        setIsInFlow(currentFlow);
        
        // H1.3: Telemetria de mudança de estado
        track('FLOW_STATE_CHANGED', {
          inFlow: currentFlow,
          dwellTimeAvg: Math.round(detector.getAverageDwellTime()),
          uiToggles: detector.getUIToggles(),
          mode: modeConfig.label
        });
      }
    }, 5000); // Check a cada 5 segundos

    return () => clearInterval(interval);
  }, [detector, isInFlow, modeConfig, track]);

  return { isInFlow };
}
