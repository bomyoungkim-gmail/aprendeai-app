/**
 * Glossary Mock Data
 * 
 * Mock definitions for scientific terms used in E2E tests
 */

import { GlossaryDefinition } from '@/types/scientific';

export const MOCK_DEFINITIONS: Record<string, GlossaryDefinition> = {
  mitochondria: {
    term: 'mitochondria',
    definition: 'Organelas celulares responsáveis pela produção de energia (ATP) através da respiração celular.',
    source: 'Wikipedia - Biologia Celular',
    examples: [
      'As mitocôndrias são conhecidas como as "usinas de energia" da célula.',
    ],
  },
  photosynthesis: {
    term: 'photosynthesis',
    definition: 'Processo pelo qual plantas, algas e algumas bactérias convertem luz solar em energia química armazenada em moléculas de glicose.',
    source: 'Khan Academy - Biologia',
    examples: [
      'A fotossíntese ocorre principalmente nas folhas das plantas.',
    ],
  },
  enzyme: {
    term: 'enzyme',
    definition: 'Proteína que atua como catalisador biológico, acelerando reações bioquímicas sem ser consumida no processo.',
    source: 'Nature - Biochemistry',
    examples: [
      'As enzimas digestivas quebram moléculas grandes de alimentos em moléculas menores.',
    ],
  },
  dna: {
    term: 'DNA',
    definition: 'Ácido desoxirribonucleico, molécula que carrega a informação genética dos organismos.',
    source: 'NCBI - Genetics',
  },
  protein: {
    term: 'protein',
    definition: 'Macromolécula composta por aminoácidos que desempenha funções estruturais e catalíticas nas células.',
    source: 'Biochemistry Textbook',
  },
};

/**
 * Fetch glossary definition (mock implementation)
 * In production, this would call an API
 */
export async function getGlossaryDefinition(term: string): Promise<GlossaryDefinition | null> {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 800));
  
  const normalizedTerm = term.toLowerCase();
  return MOCK_DEFINITIONS[normalizedTerm] || null;
}

/**
 * Check if a term has a glossary definition
 */
export function hasGlossaryDefinition(term: string): boolean {
  const normalizedTerm = term.toLowerCase();
  return normalizedTerm in MOCK_DEFINITIONS;
}
