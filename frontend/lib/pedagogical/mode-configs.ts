import { ContentMode } from '../types/content-mode';

export interface PedagogicalConfig {
  // UI Behavior
  defaultUiAutoHideDelayMs: number;
  scaffoldingUiAutoHideDelayMs: number;
  
  // Intervention Rules
  interventionCooldownMs: number;
  interventionMaxPerSession: number;
  interventionAggressivenessFactor: number;
  
  // Flow Detection
  flowDwellTimeMinMs: number;
  flowAlternationMaxCount: number;
  flowToggleMaxPerMinute: number;
  
  // Confusion Detection
  confusionScrollBurstThreshold: number;
  confusionZoomRepeatThreshold: number;
  confusionRereadThreshold: number;
  
  // Mode-specific features (Sprint 5)
  paginationMode?: 'fluid' | 'sections' | 'pages';
  trackContinuity?: boolean;
  checkpointsEnabled?: boolean;
  tocAlwaysVisible?: boolean;
  searchEnabled?: boolean;
  exportEnabled?: boolean;
}

export const MODE_PEDAGOGICAL_CONFIGS: Record<ContentMode, PedagogicalConfig> = {
  [ContentMode.NARRATIVE]: {
    // G1.1: UI Invisível - auto-hide mais agressivo
    defaultUiAutoHideDelayMs: 2000, // 2s (mais rápido que outros modos)
    scaffoldingUiAutoHideDelayMs: 2000, // Sem scaffolding em NARRATIVE
    
    // G1.2: Zero Intervenções
    interventionCooldownMs: Infinity, // Nunca mostrar intervenções
    interventionMaxPerSession: 0, // Zero intervenções permitidas
    interventionAggressivenessFactor: 0, // Desabilitado
    
    // Flow detection (mais sensível para leitura imersiva)
    flowDwellTimeMinMs: 3000,
    flowAlternationMaxCount: 2,
    flowToggleMaxPerMinute: 1,
    
    // Confusion detection (relaxado - não queremos interromper)
    confusionScrollBurstThreshold: 999,
    confusionZoomRepeatThreshold: 999,
    confusionRereadThreshold: 999,
    
    // G1.3: Paginação Fluida
    paginationMode: 'fluid' as const,
    
    // G1.4: Métrica de Continuidade
    trackContinuity: true,
    
    // Checkpoints desabilitados
    checkpointsEnabled: false
  },
  [ContentMode.DIDACTIC]: {
    interventionCooldownMs: 3 * 60 * 1000, // 3 min
    interventionMaxPerSession: 8,
    interventionAggressivenessFactor: 1.0,
    defaultUiAutoHideDelayMs: 5000,
    scaffoldingUiAutoHideDelayMs: 10000,
    flowDwellTimeMinMs: 5000,
    flowAlternationMaxCount: 3,
    flowToggleMaxPerMinute: 2,
    confusionScrollBurstThreshold: 5,
    confusionZoomRepeatThreshold: 3,
    confusionRereadThreshold: 2
  },
  [ContentMode.TECHNICAL]: {
    defaultUiAutoHideDelayMs: 8000, // Mais tempo para consulta
    scaffoldingUiAutoHideDelayMs: 15000,
    interventionCooldownMs: 600000, // 10 minutes
    interventionMaxPerSession: 3,
    interventionAggressivenessFactor: 0.8,
    
    // G3.4: Navegação não-linear é normal - relaxar detecção
    flowDwellTimeMinMs: 2000, // Menos tempo para considerar flow
    flowAlternationMaxCount: 10, // Permitir muitas alternações
    flowToggleMaxPerMinute: 5,
    
    // G3.4: Confusion detection muito relaxada
    confusionScrollBurstThreshold: 15, // 3x o normal
    confusionZoomRepeatThreshold: 10,
    confusionRereadThreshold: 8,
    
    paginationMode: 'sections' as const,
    trackContinuity: false, // Não relevante para TECHNICAL
    checkpointsEnabled: false, // Opt-in apenas
    
    // G3.1: TOC sempre visível
    tocAlwaysVisible: true,
    
    // G3.2: Busca habilitada
    searchEnabled: true,
    
    // G3.3: Exportação habilitada
    exportEnabled: true
  },
  [ContentMode.NEWS]: {
    interventionCooldownMs: 8 * 60 * 1000, 
    interventionMaxPerSession: 0, // G4.2: Sem intervenções
    interventionAggressivenessFactor: 0,
    defaultUiAutoHideDelayMs: 3000,
    scaffoldingUiAutoHideDelayMs: 5000,
    flowDwellTimeMinMs: 2000,
    flowAlternationMaxCount: 3,
    flowToggleMaxPerMinute: 2,
    confusionScrollBurstThreshold: 8,
    confusionZoomRepeatThreshold: 4,
    confusionRereadThreshold: 2,
    checkpointsEnabled: false
  },
  [ContentMode.SCIENTIFIC]: {
    interventionCooldownMs: 4 * 60 * 1000, 
    interventionMaxPerSession: 6,
    interventionAggressivenessFactor: 1.2,
    defaultUiAutoHideDelayMs: 6000,
    scaffoldingUiAutoHideDelayMs: 12000,
    flowDwellTimeMinMs: 4000,
    flowAlternationMaxCount: 4,
    flowToggleMaxPerMinute: 2,
    confusionScrollBurstThreshold: 10,
    confusionZoomRepeatThreshold: 5,
    confusionRereadThreshold: 4,
    checkpointsEnabled: true, // G5.2: Checkpoints por seção
    paginationMode: 'sections' as const
  },
  [ContentMode.LANGUAGE]: {
    interventionCooldownMs: 2 * 60 * 1000, 
    interventionMaxPerSession: 10,
    interventionAggressivenessFactor: 1.5,
    defaultUiAutoHideDelayMs: 4000,
    scaffoldingUiAutoHideDelayMs: 8000,
    flowDwellTimeMinMs: 3000,
    flowAlternationMaxCount: 5,
    flowToggleMaxPerMinute: 3,
    confusionScrollBurstThreshold: 7,
    confusionZoomRepeatThreshold: 3,
    confusionRereadThreshold: 2
  },
};
