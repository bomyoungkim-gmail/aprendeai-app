// Replaced vitest import with global jest
import { renderHook, act } from '@testing-library/react';
import { useDebounce } from '@/hooks/ui/use-debounce';
import { useOnlineStatus } from '@/hooks/ui/use-online-status';

describe('UI Hooks', () => {
  describe('useDebounce', () => {
    it('should debounce value changes', async () => {
      const { result, rerender } = renderHook(
        ({ value, delay }) => useDebounce(value, delay),
        { initialProps: { value: 'initial', delay: 500 } }
      );
      
      expect(result.current).toBe('initial');
      
      // Change value
      rerender({ value: 'updated', delay: 500 });
      
      // Should still be initial (not yet debounced)
      expect(result.current).toBe('initial');
      
      // Wait for debounce
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 600));
      });
      
      expect(result.current).toBe('updated');
    });
    
    it('should handle zero delay', () => {
      const { result } = renderHook(() => useDebounce('test', 0));
      expect(result.current).toBe('test');
    });
  });
  
  describe('useOnlineStatus', () => {
    it('should return online status', () => {
      const { result } = renderHook(() => useOnlineStatus());
      
      // Should return boolean
      expect(typeof result.current).toBe('boolean');
    });
  });
});
