import { render, screen, waitFor } from '@testing-library/react';
import { Leaderboard } from '@/components/games/stats/Leaderboard';

global.fetch = jest.fn();

describe('Leaderboard', () => {
  const mockLeaders = {
    leaders: [
      { rank: 1, userId: 'u1', userName: 'Alice', totalStars: 45, avatarUrl: null },
      { rank: 2, userId: 'u2', userName: 'Bob', totalStars: 38, avatarUrl: 'http://ex.com/a.jpg' },
      { rank: 3, userId: 'u3', userName: 'Charlie', totalStars: 32, avatarUrl: null },
    ],
  };

  beforeEach(() => {
    (global.fetch as jest.Mock).mockClear();
  });

  it('renders loading state', () => {
    (global.fetch as jest.Mock).mockImplementation(() => new Promise(() => {}));
    render(<Leaderboard />);
    expect(document.querySelectorAll('.animate-pulse').length).toBeGreaterThan(0);
  });

  it('renders leaderboard data', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockLeaders,
    });

    render(<Leaderboard />);

    await waitFor(() => {
      expect(screen.getByText('Alice')).toBeInTheDocument();
      expect(screen.getByText('Bob')).toBeInTheDocument();
      expect(screen.getByText('Charlie')).toBeInTheDocument();
    });

    expect(screen.getByText('45')).toBeInTheDocument();
  });

  it('renders empty state', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ leaders: [] }),
    });

    render(<Leaderboard />);

    await waitFor(() => {
      expect(screen.getByText(/Nenhum jogador/i)).toBeInTheDocument();
    });
  });

  it('handles errors gracefully', async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));
    render(<Leaderboard />);

    await waitFor(() => {
      expect(screen.getByText(/Nenhum jogador/i)).toBeInTheDocument();
    });
  });
});
