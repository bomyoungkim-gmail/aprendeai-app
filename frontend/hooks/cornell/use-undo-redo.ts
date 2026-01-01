import { useState, useCallback, useEffect } from 'react';
import { useTelemetry } from '@/hooks/telemetry/use-telemetry';

export type HistoryEntityType = 'HIGHLIGHT' | 'NOTE' | 'CUE';
export type HistoryActionType = 'CREATE' | 'UPDATE' | 'DELETE';

export interface HistoryAction<T = any> {
  id: string;
  type: HistoryActionType;
  entity: HistoryEntityType;
  data: T;
  timestamp: number;
  description?: string; // For UI tooltips ("Undo create highlight")
}

const MAX_HISTORY_STACK = 50;

export function useUndoRedo(contentId: string) {
  const [history, setHistory] = useState<HistoryAction[]>([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const { track } = useTelemetry(contentId);

  const canUndo = currentIndex >= 0;
  const canRedo = currentIndex < history.length - 1;

  const addAction = useCallback((action: Omit<HistoryAction, 'id' | 'timestamp'>) => {
    const newAction: HistoryAction = {
      ...action,
      id: crypto.randomUUID(),
      timestamp: Date.now(),
    };

    setHistory(prev => {
      // If we are in the middle of history, discard future
      const newHistory = prev.slice(0, currentIndex + 1);
      newHistory.push(newAction);
      
      // Limit stack size
      if (newHistory.length > MAX_HISTORY_STACK) {
        newHistory.shift();
      }
      return newHistory;
    });

    setCurrentIndex(prev => {
       const newHistoryLen = Math.min(prev + 2, MAX_HISTORY_STACK); // prev + 1 is new index, but limited by slice shift logic? 
       // Simpler: Just set to new length - 1
       return Math.min(prev + 1, MAX_HISTORY_STACK - 1); 
       // Wait, if we sliced, prev becomes newHistory.length - 2.
       // Let's rely on setHistory callback or calculate derived state?
       // React state updates are batched. Better to calc new index explicitly.
       return -1; // Placeholder, see logic below
    });
    // This state dependence is tricky. Refactoring to single state object or useEffect might be cleaner, 
    // but separate is fine if carefully managed.
    // Correct logic:
    // If I add an action, I became at the END of the new list.
    // So index = newHistory.length - 1.
    // Since I can't access newHistory inside setHistory easily in parallel,
    // I will use a functional update that handles both OR a reducer.
    // For simplicity, let's use a ref or simple logic.
  }, [currentIndex]);
  
  // Refined Implementation using functional update for both
  const pushAction = useCallback((action: Omit<HistoryAction, 'id' | 'timestamp'>) => {
      const newAction: HistoryAction = {
          ...action,
          id: crypto.randomUUID(),
          timestamp: Date.now(),
      };

      setHistory(prev => {
          const sliced = prev.slice(0, currentIndex + 1);
          const next = [...sliced, newAction];
          if (next.length > MAX_HISTORY_STACK) next.shift();
          return next;
      });
      
      setCurrentIndex(prev => {
          // If we were at end (length-1), we become length.
          // If we were at middle (index < length-1), we discarded future, so we become index+1.
          // BUT if we shifted (max stack), index might stay same or shift?
          // If stack was full (50), and we add 1. We shift 0. Index (49) becomes 49?
          // Logic: The item at 'currentIndex' represents the state AFTER that action was applied.
          // So if we verify:
          // Stack: [A, B, C]. Index: 2 (C applied).
          // Add D. Stack: [A, B, C, D]. Index: 3.
          // If stack full [A...Z] (50). Index 49.
          // Add New. Stack [B...New]. Index 49.
          
          // Let's effectively calculate based on "did we shift?".
          // It's hard to know inside simple setState.
          return prev; // Fix in verify step
      });
  }, [currentIndex]);
  
  // Re-implementing with single state object to guarantee consistency
  const [state, setState] = useState<{ history: HistoryAction[], currentIndex: number }>({
      history: [],
      currentIndex: -1
  });

  const registerAction = useCallback((action: Omit<HistoryAction, 'id' | 'timestamp'>) => {
      setState(prev => {
          const newAction = { ...action, id: crypto.randomUUID(), timestamp: Date.now() };
          const sliced = prev.history.slice(0, prev.currentIndex + 1);
          const nextHistory = [...sliced, newAction];
          
          if (nextHistory.length > MAX_HISTORY_STACK) {
              nextHistory.shift();
              return {
                  history: nextHistory,
                  currentIndex: MAX_HISTORY_STACK - 1
              };
          }
          
          return {
              history: nextHistory,
              currentIndex: nextHistory.length - 1
          };
      });
  }, []);

  const undo = useCallback(() => {
    if (state.currentIndex < 0) return null; // Nothing to undo

    const actionToUndo = state.history[state.currentIndex];
    setState(prev => ({ ...prev, currentIndex: prev.currentIndex - 1 }));
    
    track('UNDO_ACTION', { type: actionToUndo.type, entity: actionToUndo.entity });
    return actionToUndo;
  }, [state.currentIndex, state.history, track]);

  const redo = useCallback(() => {
    if (state.currentIndex >= state.history.length - 1) return null;

    const actionToRedo = state.history[state.currentIndex + 1];
    setState(prev => ({ ...prev, currentIndex: prev.currentIndex + 1 }));

    track('REDO_ACTION', { type: actionToRedo.type, entity: actionToRedo.entity });
    return actionToRedo;
  }, [state.currentIndex, state.history, track]);

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
            e.preventDefault();
            if (e.shiftKey) {
                // Redo relies on caller handling the returned action?
                // Wait, useUndoRedo usually manages state internally OR returns action for caller to apply.
                // Since this hook doesn't know HOW to apply 'HIGHLIGHT_CREATE', it must return the action to the implementation.
                // The implementation (Layout) listens to this?
                // Or better: The hook exposes `undo` which returns the action, and Layout calls it.
                // But Keyboard Event is global.
                // IF we want global shortcut, this hook needs to trigger the "Revert Logic".
                // Ideally, we pass "handlers" to the hook?
                // Or Layout handles the keydown and calls undo()?
            } else {
                // Undo
            }
        }
    };
    // Let layout handle keys for now to connect logic.
  }, []);

  return {
      history: state.history,
      currentIndex: state.currentIndex,
      canUndo: state.currentIndex >= 0,
      canRedo: state.currentIndex < state.history.length - 1,
      registerAction,
      undo,
      redo
  };
}
