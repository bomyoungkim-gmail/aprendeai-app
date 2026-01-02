import { renderHook, act } from '@testing-library/react';
import { useSprintInterface } from '@/hooks/study-groups/use-sprint-interface';
import { useStartSession, useAdvanceRound, useSharedCards } from '@/hooks/sessions/group/use-sessions';

// Mocks
jest.mock('@/stores/auth-store', () => ({
  useAuthStore: jest.fn(() => ({ user: { id: 'user-1' } }))
}));

jest.mock('@/hooks/sessions/group/use-session-events', () => ({
  useSessionEvents: jest.fn(() => ({
    isConnected: true,
    isReconnecting: false,
    reconnectAttempts: 0
  }))
}));

jest.mock('@/hooks/games/use-round-timer', () => ({
  useRoundTimer: jest.fn(() => ({
    formatted: '05:00',
    isExpired: false
  }))
}));

jest.mock('@/hooks/sessions/group/use-sessions', () => ({
  useStartSession: jest.fn(),
  useAdvanceRound: jest.fn(),
  useSharedCards: jest.fn()
}));

const mockSession = {
  id: 'session-1',
  contentId: 'content-1',
  rounds: [
    { roundIndex: 1, status: 'VOTING' },
    { roundIndex: 2, status: 'CREATED' }
  ],
  members: [
    { userId: 'user-1', assignedRole: 'FACILITATOR' }
  ],
  group: {
    name: 'Test Group',
    members: [
      { userId: 'user-1', role: 'OWNER' }
    ]
  }
};

describe('useSprintInterface', () => {
  const mockStartMutate = jest.fn();
  const mockAdvanceMutate = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useStartSession as jest.Mock).mockReturnValue({
      mutateAsync: mockStartMutate,
      isPending: false
    });
    (useAdvanceRound as jest.Mock).mockReturnValue({
      mutateAsync: mockAdvanceMutate
    });
    (useSharedCards as jest.Mock).mockReturnValue({
      data: []
    });
  });

  it('should initialize with default state', () => {
    const { result } = renderHook(() => useSprintInterface(mockSession as any));

    expect(result.current.currentRoundIndex).toBe(1);
    expect(result.current.selectedHighlightIds).toEqual([]);
    expect(result.current.showSharedCards).toBe(false);
    expect(result.current.mobileActiveTab).toBe('round');
    expect(result.current.isConnected).toBe(true);
  });

  it('should compute current round correctly', () => {
    const { result } = renderHook(() => useSprintInterface(mockSession as any));
    expect(result.current.currentRound).toEqual(mockSession.rounds[0]);
  });

  it('should navigate rounds', () => {
    const { result } = renderHook(() => useSprintInterface(mockSession as any));

    act(() => {
      // Simulate "Next" navigation by creating a wrapper function or direct state update if exposed
      // Since `nextPage` isn't directly exposed but `setCurrentRoundIndex` is:
      result.current.setCurrentRoundIndex(2);
    });

    expect(result.current.currentRoundIndex).toBe(2);
    expect(result.current.currentRound).toEqual(mockSession.rounds[1]);
  });

  it('should handle start session', async () => {
    const { result } = renderHook(() => useSprintInterface(mockSession as any));

    await act(async () => {
      await result.current.handleStartSession();
    });

    expect(mockStartMutate).toHaveBeenCalled();
  });

  it('should handle advance round', async () => {
    const { result } = renderHook(() => useSprintInterface(mockSession as any));

    await act(async () => {
      await result.current.handleAdvanceRound('DISCUSSING');
    });

    expect(mockAdvanceMutate).toHaveBeenCalledWith({
      roundIndex: 1,
      toStatus: 'DISCUSSING'
    });
  });

  it('should determine correct role permission', () => {
    const { result } = renderHook(() => useSprintInterface(mockSession as any));
    expect(result.current.canAdvance).toBe(true);
  });

  it('should handle shared cards visibility', () => {
    const { result } = renderHook(() => useSprintInterface(mockSession as any));

    act(() => {
      result.current.setShowSharedCards(true);
    });

    expect(result.current.showSharedCards).toBe(true);
  });
});
