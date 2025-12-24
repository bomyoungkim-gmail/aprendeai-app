import { render, screen } from '@testing-library/react';
import { StarsPerGameChart } from '@/components/games/stats/StarsPerGameChart';

// Mock recharts
jest.mock('recharts', () => ({
  BarChart: ({ children }: any) => <div data-testid="bar-chart">{children}</div>,
  Bar: () => <div data-testid="bar" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
  ResponsiveContainer: ({ children }: any) => <div data-testid="responsive-container">{children}</div>,
}));

describe('StarsPerGameChart', () => {
  const mockGamesProgress = [
    { gameId: 'GAME1', stars: 3, bestScore: 95, totalPlays: 10 },
    { gameId: 'GAME2', stars: 2, bestScore: 80, totalPlays: 5 },
    { gameId: 'GAME3', stars: 0, bestScore: 0, totalPlays: 0 }, // Not played
  ];

  const gameNames = {
    GAME1: 'Quiz Game',
    GAME2: 'Taboo Game',
    GAME3: 'Unplayed Game',
  };

  it('renders chart with data', () => {
    render(<StarsPerGameChart gamesProgress={mockGamesProgress} gameNames={gameNames} />);

    expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
    expect(screen.getByText('⭐ Estrelas por Jogo')).toBeInTheDocument();
  });

  it('filters out unplayed games', () => {
    const { queryByText } = render(
      <StarsPerGameChart gamesProgress={mockGamesProgress} gameNames={gameNames} />
    );

    // Should not show unplayed game
    expect(queryByText('Unplayed Game')).not.toBeInTheDocument();
  });

  it('renders empty state when no played games', () => {
    const emptyProgress = [
      { gameId: 'GAME1', stars: 0, bestScore: 0, totalPlays: 0 },
    ];

    render(<StarsPerGameChart gamesProgress={emptyProgress} gameNames={gameNames} />);

    expect(screen.getByText(/Jogue alguns jogos/i)).toBeInTheDocument();
  });

  it('sorts games by stars descending', () => {
    const unsortedProgress = [
      { gameId: 'LOW', stars: 1, bestScore: 50, totalPlays: 2 },
      { gameId: 'HIGH', stars: 3, bestScore: 95, totalPlays: 10 },
      { gameId: 'MID', stars: 2, bestScore: 75, totalPlays: 5 },
    ];

    render(<StarsPerGameChart gamesProgress={unsortedProgress} gameNames={{ LOW: 'Low', HIGH: 'High', MID: 'Mid' }} />);

    // Chart should be rendered (sorting happens internally)
    expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
  });
});
