import { ContentMode } from '../types/content-mode';

/**
 * Configuração de comportamento por modo de conteúdo
 */
export interface ModeConfig {
  // UI Presentation
  label: string;
  description: string;
  themeColor: string;

  // Flow detection
  flowDwellTimeMin: number;        // ms - tempo mínimo de permanência para considerar flow
  flowAlternationMax: number;      // count - máximo de alternâncias permitidas
  flowToggleMax: number;           // count per minute - máximo de toggles de UI

  // Confusion detection
  confusionScrollBurstThreshold: number;  // count - threshold para scroll rápido
  confusionZoomRepeatThreshold: number;   // count - threshold para zoom repetido
  confusionRereadThreshold: number;       // count - threshold para releitura

  // UI behavior
  uiAutoHideDelay: number;         // ms - delay para esconder UI automaticamente
  uiShowOnGesture: boolean;        // mostrar UI com gesto

  // Interventions
  interventionCooldown: number;    // ms - tempo entre intervenções
  interventionMaxPerSession: number;  // máximo de intervenções por sessão
  interventionReduceAfterDismiss: number;  // fator de redução após dismiss (0-1)
}

/**
 * Configurações específicas por modo de conteúdo
 */
export const MODE_CONFIGS: Record<ContentMode, ModeConfig> = {
  [ContentMode.NARRATIVE]: {
    label: 'Narrativo',
    description: 'Focado em leitura linear e imersiva. Menos distrações.',
    themeColor: '#A855F7', // Purple
    
    // Flow detection - narrativas requerem leitura contínua
    flowDwellTimeMin: 3000,
    flowAlternationMax: 2,
    flowToggleMax: 1,

    // Confusion detection - tolerante a navegação
    confusionScrollBurstThreshold: 10,
    confusionZoomRepeatThreshold: 5,
    confusionRereadThreshold: 3,

    // UI behavior - UI mínima para imersão
    uiAutoHideDelay: 2000,
    uiShowOnGesture: true,

    // Interventions - mínimas para não quebrar flow
    interventionCooldown: 300000, // 5 min
    interventionMaxPerSession: 1,
    interventionReduceAfterDismiss: 0.5,
  },

  [ContentMode.DIDACTIC]: {
    label: 'Didático',
    description: 'Otimizado para estudo e aprendizado. Ferramentas sempre à mão.',
    themeColor: '#3B82F6', // Blue

    // Flow detection - permite mais interação
    flowDwellTimeMin: 5000,
    flowAlternationMax: 3,
    flowToggleMax: 2,

    // Confusion detection
    confusionScrollBurstThreshold: 15,
    confusionZoomRepeatThreshold: 7,
    confusionRereadThreshold: 5,

    // UI behavior - UI mais presente
    uiAutoHideDelay: 5000,
    uiShowOnGesture: true,

    // Interventions - mais frequentes para apoio
    interventionCooldown: 120000, // 2 min
    interventionMaxPerSession: 5,
    interventionReduceAfterDismiss: 0.7,
  },

  [ContentMode.TECHNICAL]: {
    label: 'Técnico',
    description: 'Para documentação e manuais. Foco em busca e referência.',
    themeColor: '#6B7280', // Gray

    // Flow detection - permite navegação não-linear
    flowDwellTimeMin: 7000,
    flowAlternationMax: 5,
    flowToggleMax: 3,

    // Confusion detection - muito tolerante
    confusionScrollBurstThreshold: 25,
    confusionZoomRepeatThreshold: 10,
    confusionRereadThreshold: 8,

    // UI behavior
    uiAutoHideDelay: 7000,
    uiShowOnGesture: true,

    // Interventions - moderadas
    interventionCooldown: 180000, // 3 min
    interventionMaxPerSession: 3,
    interventionReduceAfterDismiss: 0.6,
  },

  [ContentMode.NEWS]: {
    label: 'Notícias',
    description: 'Leitura rápida e dinâmica.',
    themeColor: '#F59E0B', // Amber

    // Flow detection - leitura rápida
    flowDwellTimeMin: 2000,
    flowAlternationMax: 2,
    flowToggleMax: 1,

    // Confusion detection - menos tolerante
    confusionScrollBurstThreshold: 8,
    confusionZoomRepeatThreshold: 3,
    confusionRereadThreshold: 2,

    // UI behavior
    uiAutoHideDelay: 3000,
    uiShowOnGesture: true,

    // Interventions - mínimas ou nenhuma
    interventionCooldown: 600000, // 10 min
    interventionMaxPerSession: 0,
    interventionReduceAfterDismiss: 0,
  },

  [ContentMode.SCIENTIFIC]: {
    label: 'Científico',
    description: 'Análise profunda. Detecção de termos complexos aumentada.',
    themeColor: '#10B981', // Emerald

    // Flow detection - leitura profunda
    flowDwellTimeMin: 8000,
    flowAlternationMax: 4,
    flowToggleMax: 2,

    // Confusion detection
    confusionScrollBurstThreshold: 20,
    confusionZoomRepeatThreshold: 8,
    confusionRereadThreshold: 6,

    // UI behavior
    uiAutoHideDelay: 8000,
    uiShowOnGesture: true,

    // Interventions - moderadas com suporte
    interventionCooldown: 150000, // 2.5 min
    interventionMaxPerSession: 4,
    interventionReduceAfterDismiss: 0.65,
  },

  [ContentMode.LANGUAGE]: {
    label: 'Idiomas',
    description: 'Foco em vocabulário e tradução. Imersão controlada.',
    themeColor: '#EC4899', // Pink

    // Flow detection - permite pausas para vocabulário
    flowDwellTimeMin: 4000,
    flowAlternationMax: 3,
    flowToggleMax: 2,

    // Confusion detection
    confusionScrollBurstThreshold: 12,
    confusionZoomRepeatThreshold: 6,
    confusionRereadThreshold: 4,

    // UI behavior
    uiAutoHideDelay: 4000,
    uiShowOnGesture: true,

    // Interventions - mais frequentes para vocabulário
    interventionCooldown: 90000, // 1.5 min
    interventionMaxPerSession: 6,
    interventionReduceAfterDismiss: 0.75,
  },
};

/**
 * Versão da política de UI - incrementar quando mudar configurações
 */
export const UI_POLICY_VERSION = '1.0.0';

/**
 * Obter configuração para um modo específico
 */
export function getModeConfig(mode: ContentMode): ModeConfig {
  return MODE_CONFIGS[mode];
}

/**
 * Obter configuração padrão (NARRATIVE)
 */
export function getDefaultModeConfig(): ModeConfig {
  return MODE_CONFIGS[ContentMode.NARRATIVE];
}
