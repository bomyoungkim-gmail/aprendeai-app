import { render } from '@testing-library/react';
import { GameStatsCard } from '@/components/games/stats/GameStatsCard';

// Mock ActivityStats component
jest.mock('@/components/dashboard/ActivityStats', () => ({
  ActivityStats: ({ stats }: any) => (
    <div data-testid="activity-stats">
      <div>Total Days: {stats.totalDays}</div>
      <div>Current Streak: {stats.currentStreak}</div>
      <div>Avg Minutes: {stats.avgMinutesPerDay}</div>
    </div>
  ),
}));

describe('GameStatsCard', () => {
  it('renders with game stats', () => {
    const { getByText } = render(
      <GameStatsCard
        totalStars={25}
        currentStreak={7}
        gamesPlayed={10}
        avgScore={85}
      />
    );

    expect(getByText('Total Days: 10')).toBeInTheDocument();
    expect(getByText('Current Streak: 7')).toBeInTheDocument();
    expect(getByText('Avg Minutes: 85')).toBeInTheDocument();
  });

  it('adapts game stats to activity stats format', () => {
    const { getByTestId } = render(
      <GameStatsCard
        totalStars={30}
        currentStreak={5}
        gamesPlayed={15}
        avgScore={90}
      />
    );

    const statsElement = getByTestId('activity-stats');
    expect(statsElement).toBeInTheDocument();
  });

  it('handles zero values', () => {
    const { getByText } = render(
      <GameStatsCard
        totalStars={0}
        currentStreak={0}
        gamesPlayed={0}
        avgScore={0}
      />
    );

    expect(getByText('Total Days: 0')).toBeInTheDocument();
    expect(getByText('Current Streak: 0')).toBeInTheDocument();
  });
});
