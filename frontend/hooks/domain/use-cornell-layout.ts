/**
 * Cornell Layout Domain Hook
 * 
 * Manages UI state for the Cornell layout including sidebar, tabs, actions,
 * color selection, modals, search/filter, and selection actions.
 * 
 * This hook extracts UI state management from ModernCornellLayout to make
 * the component a pure orchestrator.
 */

import type { CornellLayoutContextType as UseCornellLayoutReturn } from '@/contexts/CornellLayoutContext';
export type { UseCornellLayoutReturn };

import { useCornellLayout as useCornellLayoutContext } from '@/contexts/CornellLayoutContext';

/**
 * Hook for managing Cornell layout UI state
 * 
 * Now bridges to the centralized CornellLayoutProvider context.
 */
export function useCornellLayout() {
  return useCornellLayoutContext();
}
