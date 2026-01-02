// Replaced vitest import with global jest
import { renderHook } from '@testing-library/react';
import { useGameAnimation } from '@/hooks/games/use-game-animation';
import { useGameProgress } from '@/hooks/games/use-game-progress';

describe('Games Hooks', () => {
  describe('useGameAnimation', () => {
    it('should return animation state and controls', () => {
      const { result } = renderHook(() => useGameAnimation());
      
      expect(result.current).toHaveProperty('isAnimating');
      expect(result.current).toHaveProperty('startAnimation');
      expect(result.current).toHaveProperty('stopAnimation');
    });
  });
  
  describe('useGameProgress', () => {
    it('should fetch game progress for user', async () => {
      const userId = 'test-user-123';
      const { result } = renderHook(() => useGameProgress(userId));
      
      // Validate structure (actual API call would be mocked)
      expect(result.current).toHaveProperty('progress');
      expect(result.current).toHaveProperty('loading');
    });
  });
});
