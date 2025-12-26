import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

// Import from barrel files
import { useSession, useCreateSession, useStartSession } from '../group/use-sessions';
import { useSessionEvents } from '../group/use-session-events';

describe('Group Sessions Hooks', () => {
  let queryClient: QueryClient;
  
  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
  });
  
  const wrapper = ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);
  
  describe('useSession', () => {
    it('should fetch group session by id', () => {
      const sessionId = 'test-session-123';
      const { result } = renderHook(() => useSession(sessionId), { wrapper });
      
      expect(result.current).toHaveProperty('data');
      expect(result.current).toHaveProperty('isLoading');
    });
  });
  
  describe('useCreateSession', () => {
    it('should provide mutation for creating session', () => {
      const { result } = renderHook(() => useCreateSession(), { wrapper });
      
      expect(result.current).toHaveProperty('mutate');
      expect(result.current).toHaveProperty('isPending');
    });
  });
  
  describe('useStartSession', () => {
    it('should provide mutation for starting session', () => {
      const sessionId = 'test-session-123';
      const { result } = renderHook(() => useStartSession(sessionId), { wrapper });
      
      expect(result.current).toHaveProperty('mutate');
      expect(result.current).toHaveProperty('isPending');
    });
  });
});
