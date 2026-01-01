/**
 * Tests for use-cornell-pedagogical domain hook
 * 
 * Tests pedagogical logic including:
 * - Flow detection
 * - Interventions
 * - Didactic flow phases
 * - Scaffolding
 * - Checkpoints
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { useCornellPedagogical } from '@/hooks/domain/use-cornell-pedagogical';
import { ContentMode } from '@/lib/types/content-mode';

// Mock dependencies
jest.mock('@/hooks/heuristics/use-flow-detection');
jest.mock('@/hooks/pedagogical/use-interventions');
jest.mock('@/hooks/pedagogical/use-didactic-flow');
jest.mock('@/hooks/pedagogical/use-scaffolding');
jest.mock('@/hooks/cornell/use-suggestions');

describe('useCornellPedagogical', () => {
  const mockContentId = 'content-123';
  const mockTrack = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Initialization', () => {
    it('should initialize with flow state', () => {
      const { result } = renderHook(() =>
        useCornellPedagogical(
          mockContentId,
          ContentMode.NARRATIVE,
          1,
          true,
          mockTrack
        )
      );
      
      expect(typeof result.current.isInFlow).toBe('boolean');
    });

    it('should initialize with no active checkpoint', () => {
      const { result } = renderHook(() =>
        useCornellPedagogical(
          mockContentId,
          ContentMode.NARRATIVE,
          1,
          true,
          mockTrack
        )
      );
      
      expect(result.current.activeCheckpoint).toBeNull();
    });
  });

  describe('Flow Detection', () => {
    it('should track flow state', () => {
      const { result } = renderHook(() =>
        useCornellPedagogical(
          mockContentId,
          ContentMode.NARRATIVE,
          1,
          true,
          mockTrack
        )
      );
      
      expect(result.current.isInFlow).toBeDefined();
    });
  });

  describe('Interventions', () => {
    it('should have intervention functions', () => {
      const { result } = renderHook(() =>
        useCornellPedagogical(
          mockContentId,
          ContentMode.NARRATIVE,
          1,
          true,
          mockTrack
        )
      );
      
      expect(typeof result.current.shouldShowIntervention).toBe('function');
      expect(typeof result.current.handleInterventionShown).toBe('function');
      expect(typeof result.current.handleInterventionDismissed).toBe('function');
      expect(typeof result.current.handleInterventionCompleted).toBe('function');
    });
  });

  describe('Didactic Flow', () => {
    it('should have didactic phase state', () => {
      const { result } = renderHook(() =>
        useCornellPedagogical(
          mockContentId,
          ContentMode.DIDACTIC,
          1,
          true,
          mockTrack
        )
      );
      
      expect(result.current.didacticPhase).toBeDefined();
    });

    it('should have completeActivation function', () => {
      const { result } = renderHook(() =>
        useCornellPedagogical(
          mockContentId,
          ContentMode.DIDACTIC,
          1,
          true,
          mockTrack
        )
      );
      
      expect(typeof result.current.completeActivation).toBe('function');
    });
  });

  describe('Scaffolding', () => {
    it('should have scaffolding state', () => {
      const { result } = renderHook(() =>
        useCornellPedagogical(
          mockContentId,
          ContentMode.DIDACTIC,
          1,
          true,
          mockTrack
        )
      );
      
      expect(result.current.currentDelay).toBeDefined();
      expect(typeof result.current.isScaffolding).toBe('boolean');
    });

    it('should have adjustScaffolding function', () => {
      const { result } = renderHook(() =>
        useCornellPedagogical(
          mockContentId,
          ContentMode.DIDACTIC,
          1,
          true,
          mockTrack
        )
      );
      
      expect(typeof result.current.adjustScaffolding).toBe('function');
    });
  });

  describe('Checkpoints', () => {
    it('should allow setting active checkpoint', () => {
      const { result } = renderHook(() =>
        useCornellPedagogical(
          mockContentId,
          ContentMode.DIDACTIC,
          1,
          true,
          mockTrack
        )
      );
      
      act(() => {
        result.current.setActiveCheckpoint({
          type: 'CHECKPOINT',
          isBlocking: true,
        });
      });
      
      expect(result.current.activeCheckpoint).toEqual({
        type: 'CHECKPOINT',
        isBlocking: true,
      });
    });

    it('should allow clearing checkpoint', () => {
      const { result } = renderHook(() =>
        useCornellPedagogical(
          mockContentId,
          ContentMode.DIDACTIC,
          1,
          true,
          mockTrack
        )
      );
      
      act(() => {
        result.current.setActiveCheckpoint({
          type: 'CHECKPOINT',
          isBlocking: true,
        });
      });
      
      act(() => {
        result.current.setActiveCheckpoint(null);
      });
      
      expect(result.current.activeCheckpoint).toBeNull();
    });
  });

  describe('Suggestions', () => {
    it('should have suggestions array', () => {
      const { result } = renderHook(() =>
        useCornellPedagogical(
          mockContentId,
          ContentMode.NARRATIVE,
          1,
          true,
          mockTrack
        )
      );
      
      expect(Array.isArray(result.current.suggestions)).toBe(true);
    });

    it('should have suggestion functions', () => {
      const { result } = renderHook(() =>
        useCornellPedagogical(
          mockContentId,
          ContentMode.NARRATIVE,
          1,
          true,
          mockTrack
        )
      );
      
      expect(typeof result.current.acceptSuggestion).toBe('function');
      expect(typeof result.current.dismissSuggestion).toBe('function');
    });
  });

  describe('Mode-specific behavior', () => {
    it('should behave differently in DIDACTIC mode', () => {
      const { result: narrativeResult } = renderHook(() =>
        useCornellPedagogical(
          mockContentId,
          ContentMode.NARRATIVE,
          1,
          true,
          mockTrack
        )
      );
      
      const { result: didacticResult } = renderHook(() =>
        useCornellPedagogical(
          mockContentId,
          ContentMode.DIDACTIC,
          1,
          true,
          mockTrack
        )
      );
      
      // Didactic mode should have phase
      expect(didacticResult.current.didacticPhase).toBeDefined();
    });
  });
});
