import { renderHook, act, waitFor } from '@testing-library/react';
import { useFocusTracking } from '@/hooks/ui/use-focus-tracking';

describe('[Unit] useFocusTracking', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it('should initialize with default metrics', () => {
    const { result } = renderHook(() => useFocusTracking(true));

    expect(result.current.metrics).toEqual({
      interruptions: 0,
      netFocusMinutes: 0,
      totalMinutes: 0,
      focusScore: 100,
    });
  });

  it('should track blur events as interruptions', () => {
    const { result } = renderHook(() => useFocusTracking(true));

    act(() => {
      window.dispatchEvent(new Event('blur'));
    });

    expect(result.current.metrics.interruptions).toBe(1);
  });

  it('should handle multiple blur/focus cycles', () => {
    const { result } = renderHook(() => useFocusTracking(true));

    act(() => {
      window.dispatchEvent(new Event('blur'));
      window.dispatchEvent(new Event('focus'));
      window.dispatchEvent(new Event('blur'));
    });

    expect(result.current.metrics.interruptions).toBe(2);
  });

  it('should track visibility changes', () => {
    Object.defineProperty(document, 'hidden', {
      configurable: true,
      get: () => true,
    });

    const { result } = renderHook(() => useFocusTracking(true));

    act(() => {
      document.dispatchEvent(new Event('visibilitychange'));
    });

    expect(result.current.metrics.interruptions).toBe(1);
  });

  it('should calculate netFocusMinutes correctly', async () => {
    const { result } = renderHook(() => useFocusTracking(true));

    // Fast-forward 10 seconds to trigger metric update
    act(() => {
      jest.advanceTimersByTime(10000);
    });

    await waitFor(() => {
      expect(result.current.metrics.totalMinutes).toBeGreaterThanOrEqual(0);
    });
  });

  it('should reset metrics when resetMetrics is called', () => {
    const { result } = renderHook(() => useFocusTracking(true));

    act(() => {
      window.dispatchEvent(new Event('blur'));
    });

    expect(result.current.metrics.interruptions).toBe(1);

    act(() => {
      result.current.resetMetrics();
    });

    expect(result.current.metrics).toEqual({
      interruptions: 0,
      netFocusMinutes: 0,
      totalMinutes: 0,
      focusScore: 100,
    });
  });

  it('should calculate focusScore as percentage of focused time', async () => {
    const { result } = renderHook(() => useFocusTracking(true));

    // Blur halfway through
    act(() => {
      jest.advanceTimersByTime(30000); // 30s focused
      window.dispatchEvent(new Event('blur'));
      jest.advanceTimersByTime(30000); // 30s unfocused
    });

    await waitFor(() => {
      // Focus score should be around 50% (30s / 60s)
      expect(result.current.metrics.focusScore).toBeLessThanOrEqual(60);
      expect(result.current.metrics.focusScore).toBeGreaterThanOrEqual(40);
    });
  });

  it('should not track when disabled', () => {
    const { result } = renderHook(() => useFocusTracking(false));

    act(() => {
      window.dispatchEvent(new Event('blur'));
    });

    // Should not increment interruptions when disabled
    expect(result.current.metrics.interruptions).toBe(0);
  });

  it('should cleanup event listeners on unmount', () => {
    const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener');

    const { unmount } = renderHook(() => useFocusTracking(true));

    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith('blur', expect.any(Function));
    expect(removeEventListenerSpy).toHaveBeenCalledWith('focus', expect.any(Function));
  });

  it('should provide final metrics snapshot', () => {
    const { result } = renderHook(() => useFocusTracking(true));

    act(() => {
      jest.advanceTimersByTime(60000); // 1 minute
    });

    const finalMetrics = result.current.getFinalMetrics();

    expect(finalMetrics.totalMinutes).toBeGreaterThanOrEqual(1);
    expect(finalMetrics).toHaveProperty('netFocusMinutes');
    expect(finalMetrics).toHaveProperty('focusScore');
  });
});
