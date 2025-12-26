import { renderHook } from '@testing-library/react';
import { useAutoTrackReading, useAutoTrackSession, useAutoTrackAnnotation } from '@/hooks/shared/use-auto-track';
import { useTrackActivity } from '@/hooks/profile/use-activity';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';

// Mock the useTrackActivity hook
jest.mock('@/hooks/profile/use-activity');

const mockMutate = jest.fn();
const mockUseTrackActivity = useTrackActivity as jest.MockedFunction<typeof useTrackActivity>;

describe('[Unit] use-auto-track hooks', () => {
  beforeEach(() => {
    jest.clearAllTimers();
    jest.useFakeTimers();
    mockMutate.mockClear();

    mockUseTrackActivity.mockReturnValue({
      mutate: mockMutate,
      mutateAsync: jest.fn(),
      isLoading: false,
    } as any);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  const createWrapper = () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    return ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };

  describe('useAutoTrackReading', () => {
    it('should track read activity immediately on mount', () => {
      const wrapper = createWrapper();
      renderHook(() => useAutoTrackReading('content-123'), { wrapper });

      expect(mockMutate).toHaveBeenCalledWith({
        type: 'read',
        minutes: 1,
      });
    });

    it('should track read activity every 30 seconds', () => {
      const wrapper = createWrapper();
      renderHook(() => useAutoTrackReading('content-123'), { wrapper });

      mockMutate.mockClear();

      // Fast-forward 30 seconds
      jest.advanceTimersByTime(30000);

      expect(mockMutate).toHaveBeenCalledTimes(1);
      expect(mockMutate).toHaveBeenLastCalledWith({
        type: 'read',
        minutes: 1,
      });
    });

    it('should stop tracking when contentId is empty', () => {
      const wrapper = createWrapper();
      const { rerender } = renderHook(
        ({ contentId }) => useAutoTrackReading(contentId),
        { wrapper, initialProps: { contentId: 'content-123' } }
      );

      mockMutate.mockClear();

      rerender({ contentId: '' });

      jest.advanceTimersByTime(30000);

      expect(mockMutate).not.toHaveBeenCalled();
    });

    it('should cleanup interval on unmount', () => {
      const wrapper = createWrapper();
      const { unmount } = renderHook(() => useAutoTrackReading('content-123'), { wrapper });

      unmount();
      mockMutate.mockClear();

      jest.advanceTimersByTime(30000);

      expect(mockMutate).not.toHaveBeenCalled();
    });
  });

  describe('useAutoTrackSession', () => {
    it('should not track when session is inactive', () => {
      const wrapper = createWrapper();
      renderHook(() => useAutoTrackSession('session-123', false), { wrapper });

      mockMutate.mockClear();
      jest.advanceTimersByTime(5 * 60 * 1000);

      expect(mockMutate).not.toHaveBeenCalled();
    });

    it('should track session every 5 minutes when active', () => {
      const wrapper = createWrapper();
      renderHook(() => useAutoTrackSession('session-123', true), { wrapper });

      mockMutate.mockClear();

      // Fast-forward 5 minutes
      jest.advanceTimersByTime(5 * 60 * 1000);

      expect(mockMutate).toHaveBeenCalledWith({
        type: 'session',
        minutes: 5,
      });
    });

    it('should stop tracking when session becomes inactive', () => {
      const wrapper = createWrapper();
      const { rerender } = renderHook(
        ({ isActive }) => useAutoTrackSession('session-123', isActive),
        { wrapper, initialProps: { isActive: true } }
      );

      mockMutate.mockClear();

      rerender({ isActive: false });

      jest.advanceTimersByTime(5 * 60 * 1000);

      expect(mockMutate).not.toHaveBeenCalled();
    });

    it('should cleanup interval on unmount', () => {
      const wrapper = createWrapper();
      const { unmount } = renderHook(() => useAutoTrackSession('session-123', true), { wrapper });

      unmount();
      mockMutate.mockClear();

      jest.advanceTimersByTime(5 * 60 * 1000);

      expect(mockMutate).not.toHaveBeenCalled();
    });
  });

  describe('useAutoTrackAnnotation', () => {
    it('should return a function to track annotations', () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => useAutoTrackAnnotation(), { wrapper });

      expect(typeof result.current).toBe('function');
    });

    it('should track annotation when called', () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => useAutoTrackAnnotation(), { wrapper });

      result.current();

      expect(mockMutate).toHaveBeenCalledWith({
        type: 'annotation',
        minutes: 1,
      });
    });
  });
});
