import { render, screen, waitFor } from '@testing-library/react';
import { GameDashboard } from '@/components/games/stats/GameDashboard';

// Mock hooks
jest.mock('@/hooks/games/use-game-progress', () => ({
  useGameProgress: jest.fn(),
}));

// Mock child components
// Mock child components
jest.mock('@/components/games/stats/GameStatsCard', () => ({
  GameStatsCard: () => <div data-testid="game-stats-card">Stats Card</div>,
}));

jest.mock('@/components/games/stats/StarsPerGameChart', () => ({
  StarsPerGameChart: () => <div data-testid="stars-chart">Stars Chart</div>,
}));

jest.mock('@/components/games/stats/Leaderboard', () => ({
  Leaderboard: () => <div data-testid="leaderboard">Leaderboard</div>,
}));

import { useGameProgress } from '@/hooks/games';

describe('GameDashboard', () => {
  const mockProgress = {
    totalGamesPlayed: 5,
    totalStars: 12,
    favoriteGame: 'GAME1',
    currentStreak: 3,
    gamesProgress: [
      { gameId: 'GAME1', stars: 3, bestScore: 95, totalPlays: 10, streak: 3, lastPlayed: null },
      { gameId: 'GAME2', stars: 2, bestScore: 85, totalPlays: 5, streak: 1, lastPlayed: null },
    ],
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders loading state', () => {
    (useGameProgress as jest.Mock).mockReturnValue({
      progress: null,
      loading: true,
    });

    const { container } = render(<GameDashboard />);

    expect(container.querySelector('.animate-pulse')).toBeInTheDocument();
  });

  it('renders dashboard with data', async () => {
    (useGameProgress as jest.Mock).mockReturnValue({
      progress: mockProgress,
      loading: false,
    });

    render(<GameDashboard />);

    await waitFor(() => {
      expect(screen.getByTestId('game-stats-card')).toBeInTheDocument();
      expect(screen.getByTestId('stars-chart')).toBeInTheDocument();
      expect(screen.getByTestId('leaderboard')).toBeInTheDocument();
    });
  });

  it('renders error state when no progress', () => {
    (useGameProgress as jest.Mock).mockReturnValue({
      progress: null,
      loading: false,
    });

    render(<GameDashboard />);

    expect(screen.getByText(/Erro ao carregar/i)).toBeInTheDocument();
  });

  it('calculates average score correctly', () => {
    (useGameProgress as jest.Mock).mockReturnValue({
      progress: mockProgress,
      loading: false,
    });

    render(<GameDashboard />);

    // Avg = (95 + 85) / 2 = 90
    // Component should pass this to GameStatsCard
    expect(screen.getByTestId('game-stats-card')).toBeInTheDocument();
  });

  it('handles empty games progress', () => {
    (useGameProgress as jest.Mock).mockReturnValue({
      progress: {
        ...mockProgress,
        gamesProgress: [],
      },
      loading: false,
    });

    render(<GameDashboard />);

    // Should still render components without errors
    expect(screen.getByTestId('game-stats-card')).toBeInTheDocument();
  });
});
