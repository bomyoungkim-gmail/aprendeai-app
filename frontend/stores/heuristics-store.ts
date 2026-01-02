import { create } from 'zustand';

interface HeuristicsState {
  isInFlow: boolean;
  isConfused: boolean;
  isUIOverloaded: boolean;
  overloadSuggestion: string | null;

  // Actions
  setFlow: (active: boolean) => void;
  setConfusion: (active: boolean) => void;
  setUIOverload: (active: boolean, suggestion: string | null) => void;
  resetAll: () => void;
}

/**
 * useHeuristicsStore
 * 
 * Centraliza os estados cognitivos detectados pelas heurísticas.
 * Permite que componentes de interface reajam globalmente ao estado do usuário.
 */
export const useHeuristicsStore = create<HeuristicsState>((set) => ({
  isInFlow: false,
  isConfused: false,
  isUIOverloaded: false,
  overloadSuggestion: null,

  setFlow: (active) => set({ isInFlow: active }),
  setConfusion: (active) => set({ isConfused: active }),
  setUIOverload: (active, suggestion) => set({ 
    isUIOverloaded: active, 
    overloadSuggestion: active ? suggestion : null 
  }),
  
  resetAll: () => set({
    isInFlow: false,
    isConfused: false,
    isUIOverloaded: false,
    overloadSuggestion: null
  }),
}));
