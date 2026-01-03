import type { SynthesisStreamItem, SynthesisCategory } from '../types/unified-stream';

/**
 * Synthesis Business Limits
 */
export const SYNTHESIS_LIMITS = {
  MIN: 50,
  IDEAL_MIN: 150,
  IDEAL_MAX: 600,
  WARN: 1000,
  MAX: 1200,
} as const;

export type SynthesisStatus = 'insufficient' | 'ideal' | 'long' | 'limit';

/**
 * Get the status metrics for a synthesis text
 */
export function getSynthesisStatus(text: string): {
  length: number;
  status: SynthesisStatus;
  color: string;
  canSave: boolean;
} {
  const length = text.trim().length;
  
  let status: SynthesisStatus = 'ideal';
  let color = 'text-purple-600 dark:text-purple-400';
  let canSave = true;

  if (length < SYNTHESIS_LIMITS.MIN) {
    status = 'insufficient';
    color = 'text-gray-400 dark:text-gray-500';
    canSave = false;
  } else if (length > SYNTHESIS_LIMITS.MAX) {
    status = 'limit';
    color = 'text-red-500 font-bold';
    canSave = false;
  } else if (length > SYNTHESIS_LIMITS.WARN) {
    status = 'long';
    color = 'text-red-400';
  } else if (length > SYNTHESIS_LIMITS.IDEAL_MAX) {
    status = 'long';
    color = 'text-amber-500';
  }

  return { length, status, color, canSave };
}

/**
 * Categorias Transversais labels (Display names)
 */
export const SYNTHESIS_CATEGORY_LABELS: Record<SynthesisCategory, string> = {
  resumo: 'Resumo',
  mapa_argumentos: 'Mapa de Argumentos',
  comparacao: 'Comparação',
  glossario: 'Glossário',
  linha_tempo: 'Linha do Tempo',
  causa_efeito: 'Causa e Efeito',
  analogia: 'Analogia',
  aplicacao: 'Aplicação Real',
  conclusao: 'Conclusão',
  lacuna: 'Lacuna (Open Loop)',
  metodo: 'Método/Algoritmo',
  analise_critica: 'Análise Crítica',
};

/**
 * Sort synthesis items logic:
 * 1. Author's Structure (by Chapter/Location label)
 * 2. Chronological (Oldest first within same section)
 */
export function sortSynthesisItems(items: SynthesisStreamItem[]): SynthesisStreamItem[] {
  return [...items].sort((a, b) => {
    // 1. Check for location labels (e.g., "Capítulo 1.2")
    // Simple alphanumeric sort on labels for now
    const labelA = a.anchor?.location?.label || '';
    const labelB = b.anchor?.location?.label || '';
    
    if (labelA !== labelB) {
      if (!labelA) return 1; // Items without label go to bottom
      if (!labelB) return -1;
      return labelA.localeCompare(labelB, undefined, { numeric: true });
    }

    // 2. Chronological (Oldest first)
    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
  });
}
