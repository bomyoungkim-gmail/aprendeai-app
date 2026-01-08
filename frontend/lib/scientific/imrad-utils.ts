/**
 * IMRaD Utilities
 * 
 * Utilities for working with IMRaD sections
 */

import { IMRaDSection, IMRaDSectionInfo } from '@/types/scientific';

export const IMRAD_SECTIONS: IMRaDSectionInfo[] = [
  {
    name: 'Abstract',
    label: 'Abstract',
    description: 'Resumo do artigo',
    color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  },
  {
    name: 'Introduction',
    label: 'Introduction',
    description: 'Introdução e contexto',
    color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  },
  {
    name: 'Methods',
    label: 'Methods',
    description: 'Metodologia utilizada',
    color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  },
  {
    name: 'Results',
    label: 'Results',
    description: 'Resultados obtidos',
    color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  },
  {
    name: 'Discussion',
    label: 'Discussion',
    description: 'Discussão e conclusões',
    color: 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200',
  },
];

/**
 * Get section info by name
 */
export function getSectionInfo(section: IMRaDSection): IMRaDSectionInfo | undefined {
  return IMRAD_SECTIONS.find(s => s.name === section);
}

/**
 * Detect IMRaD section from text content
 * Simple heuristic - in production would use NLP
 */
export function detectSection(text: string): IMRaDSection {
  const lowerText = text.toLowerCase();
  
  if (lowerText.includes('abstract') || lowerText.includes('resumo')) {
    return 'Abstract';
  }
  if (lowerText.includes('introduction') || lowerText.includes('introdução')) {
    return 'Introduction';
  }
  if (lowerText.includes('method') || lowerText.includes('metodologia')) {
    return 'Methods';
  }
  if (lowerText.includes('result') || lowerText.includes('resultado')) {
    return 'Results';
  }
  if (lowerText.includes('discussion') || lowerText.includes('discussão') || lowerText.includes('conclusion')) {
    return 'Discussion';
  }
  
  // Default to Introduction
  return 'Introduction';
}
