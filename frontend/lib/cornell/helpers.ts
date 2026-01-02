/**
 * Cornell Notes Helper Functions
 * 
 * Utility functions for Cornell Notes functionality
 */

import type { UnifiedStreamItem } from '@/lib/types/unified-stream';
import { inferCornellType } from './type-color-map';

/**
 * Filter synthesis items from unified stream
 */
export function filterSynthesisItems(items: UnifiedStreamItem[]): UnifiedStreamItem[] {
  return items.filter(item =>
    item.type === 'synthesis' ||
    (item.type === 'annotation' && item.highlight &&
      inferCornellType(item.highlight.colorKey, item.highlight.tagsJson) === 'SYNTHESIS')
  );
}

export function hasSynthesisItems(items: UnifiedStreamItem[]): boolean {
  return items.some(item =>
    item.type === 'synthesis' ||
    (item.type === 'annotation' && item.highlight &&
    inferCornellType(item.highlight.colorKey, item.highlight.tagsJson) === 'SYNTHESIS')
  );
}

/**
 * Check if item is a synthesis annotation
 */
export function isSynthesisItem(item: UnifiedStreamItem): boolean {
  return (
    item.type === 'annotation' &&
    inferCornellType(item.highlight.colorKey, item.highlight.tagsJson) === 'SYNTHESIS'
  );
}
