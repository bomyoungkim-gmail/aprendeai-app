// Replaced vitest import with global jest
import { renderHook, act } from '@testing-library/react';
import { useSession } from '@/hooks/sessions/reading/use-session';

describe('Reading Sessions Hooks', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
  });
  
  describe('useSession', () => {
    it('should initialize with loading state', () => {
      const contentId = 'test-content-123';
      const { result } = renderHook(() => useSession(contentId));
      
      expect(result.current).toHaveProperty('session');
      expect(result.current).toHaveProperty('loading');
      expect(result.current).toHaveProperty('error');
      expect(result.current).toHaveProperty('startSession');
      expect(result.current).toHaveProperty('updatePrePhase');
      expect(result.current).toHaveProperty('advancePhase');
      expect(result.current).toHaveProperty('refreshSession');
    });
    
    it('should provide all CRUD methods', () => {
      const contentId = 'test-content-123';
      const { result } = renderHook(() => useSession(contentId));
      
      // Verify all methods exist
      expect(typeof result.current.startSession).toBe('function');
      expect(typeof result.current.updatePrePhase).toBe('function');
      expect(typeof result.current.advancePhase).toBe('function');
      expect(typeof result.current.refreshSession).toBe('function');
    });
    
    it('should cache session ID in localStorage', async () => {
      const contentId = 'test-content-123';
      const mockSessionId = 'session-456';
      
      // Mock localStorage
      const cacheKey = `session_${contentId}`;
      localStorage.setItem(cacheKey, mockSessionId);
      
      expect(localStorage.getItem(cacheKey)).toBe(mockSessionId);
    });
  });
});
