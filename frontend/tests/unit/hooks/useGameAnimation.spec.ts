import { renderHook } from '@testing-library/react';
import { useGameAnimation } from '@/hooks/useGameAnimation';
import confetti from 'canvas-confetti';

jest.mock('canvas-confetti');

describe('useGameAnimation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('calls confetti for 3 stars', () => {
    const { result } = renderHook(() => useGameAnimation());
    result.current.celebrate(3);
    expect(confetti).toHaveBeenCalled();
  });

  it('calls confetti for 1-2 stars', () => {
    const { result } = renderHook(() => useGameAnimation());
    result.current.celebrate(2);
    
    expect(confetti).toHaveBeenCalledWith(
      expect.objectContaining({
        particleCount: 50,
        spread: 70,
      })
    );
  });

  it('does not call confetti for 0 stars', () => {
    const { result } = renderHook(() => useGameAnimation());
    result.current.celebrate(0);
    expect(confetti).not.toHaveBeenCalled();
  });

  it('triggers star burst', () => {
    const { result } = renderHook(() => useGameAnimation());
    result.current.starBurst();
    
    expect(confetti).toHaveBeenCalledWith(
      expect.objectContaining({
        shapes: ['star'],
        colors: ['#FFD700'],
      })
    );
  });
});
