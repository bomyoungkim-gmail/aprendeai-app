/**
 * Cornell Notes Helper Functions
 * 
 * Utility functions for Cornell Notes functionality
 */

import type { UnifiedStreamItem, SynthesisStreamItem } from '@/lib/types/unified-stream';
import { inferCornellType } from './type-color-map';
import type { Section } from '@/lib/content/section-detector';
import type { TocItem } from '@/lib/types/toc';

/**
 * Filter synthesis items from unified stream
 */
export function filterSynthesisItems(items: UnifiedStreamItem[]): SynthesisStreamItem[] {
  return items.filter(item =>
    item.type === 'synthesis' ||
    ['evidence', 'vocabulary', 'main-idea', 'doubt'].includes(item.type) && (item as any).highlight &&
      inferCornellType((item as any).highlight.colorKey, (item as any).highlight.tagsJson) === 'SYNTHESIS'
  ) as SynthesisStreamItem[];
}

export function hasSynthesisItems(items: UnifiedStreamItem[]): boolean {
  return items.some(item =>
    item.type === 'synthesis' ||
    (['evidence', 'vocabulary', 'main-idea', 'doubt'].includes(item.type) && (item as any).highlight &&
    inferCornellType((item as any).highlight.colorKey, (item as any).highlight.tagsJson) === 'SYNTHESIS')
  );
}

/**
 * Check if item is a synthesis item
 */
export function isSynthesisItem(item: UnifiedStreamItem): boolean {
  return (
    item.type === 'synthesis' ||
    (['evidence', 'vocabulary', 'main-idea', 'doubt'].includes(item.type) && (item as any).highlight &&
      inferCornellType((item as any).highlight.colorKey, (item as any).highlight.tagsJson) === 'SYNTHESIS')
  );
}

/**
 * Convert TOC items to Sections (for dropdowns/navigation)
 */
export function convertTocToSections(items: TocItem[]): Section[] {
  return items.flatMap(item => [
    {
       id: item.id,
       title: item.title,
       startLine: ((item.pageNumber || 1) - 1) * 40,
       type: 'HEADING' as const
    },
    ...(item.children ? convertTocToSections(item.children) : [])
  ]);
}
