/**
 * Tests for Offline Features
 */

import { renderHook, act } from '@testing-library/react';
import { offlineQueue } from '@/lib/cornell/offline-queue';
import { useOnlineStatus } from '@/hooks/use-online-status';

describe('OfflineQueue', () => {
  beforeEach(() => {
    offlineQueue.clear();
    localStorage.clear();
  });

  it('should add operation to queue', () => {
    const id = offlineQueue.add({
      type: 'CREATE',
      contentId: 'content-1',
      payload: { type: 'NOTE' },
    });

    expect(id).toBeDefined();
    expect(offlineQueue.length).toBe(1);
  });

  it('should persist queue to localStorage', () => {
    offlineQueue.add({
      type: 'CREATE',
      contentId: 'content-1',
      payload: { type: 'NOTE' },
    });

    const stored = localStorage.getItem('cornell-offline-queue');
    expect(stored).toBeDefined();
    
    const parsed = JSON.parse(stored!);
    expect(parsed.length).toBe(1);
  });

  it('should remove operation from queue', () => {
    const id = offlineQueue.add({
      type: 'CREATE',
      contentId: 'content-1',
      payload: { type: 'NOTE' },
    });

    offlineQueue.remove(id);
    expect(offlineQueue.length).toBe(0);
  });

  it('should process queue with executor', async () => {
    offlineQueue.add({
      type: 'CREATE',
      contentId: 'content-1',
      payload: { type: 'NOTE' },
    });

    const executor = jest.fn().mockResolvedValue(undefined);
    
    await offlineQueue.processQueue(executor);

    expect(executor).toHaveBeenCalledTimes(1);
    expect(offlineQueue.length).toBe(0);
  });

  it('should retry failed operations', async () => {
    offlineQueue.add({
      type: 'CREATE',
      contentId: 'content-1',
      payload: { type: 'NOTE' },
    });

    const executor = jest.fn().mockRejectedValue(new Error('Network error'));
    
    await offlineQueue.processQueue(executor);

    // Operation should still be in queue
    expect(offlineQueue.length).toBe(1);
    
    // Retry count should increment
    const ops = offlineQueue.getAll();
    expect(ops[0].retries).toBe(1);
  });

  it('should remove operation after max retries', async () => {
    // Add operation with max retries already set
    const op = offlineQueue.add({
      type: 'CREATE',
      contentId: 'content-1',
      payload: { type: 'NOTE' },
    });

    // Manually set retries to max
    const ops = offlineQueue.getAll();
    ops[0].retries = 3;

    const executor = jest.fn().mockRejectedValue(new Error('Permanent error'));
    
    await offlineQueue.processQueue(executor);

    // Should be removed after exceeding max retries
    expect(offlineQueue.length).toBe(0);
  });
});

describe('useOnlineStatus', () => {
  it('should detect online status', () => {
    const { result } = renderHook(() => useOnlineStatus());
    expect(result.current).toBe(navigator.onLine);
  });

  it('should update when going offline', () => {
    const { result } = renderHook(() => useOnlineStatus());

    act(() => {
      window.dispatchEvent(new Event('offline'));
    });

    expect(result.current).toBe(false);
  });

  it('should update when coming back online', () => {
    const { result } = renderHook(() => useOnlineStatus());

    act(() => {
      window.dispatchEvent(new Event('offline'));
    });
    expect(result.current).toBe(false);

    act(() => {
      window.dispatchEvent(new Event('online'));
    });
    expect(result.current).toBe(true);
  });
});
