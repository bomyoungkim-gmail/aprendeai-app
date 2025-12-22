import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SessionCard } from '@/components/sessions/SessionCard';
import '@testing-library/jest-dom';

const mockSession = {
  id: 'session-123',
  startedAt: '2025-01-15T10:30:00Z',
  finishedAt: '2025-01-15T11:00:00Z',
  duration: 30,
  phase: 'POST' as const,
  content: {
    id: 'content-123',
    title: 'Test Article Title',
    type: 'ARTICLE',
  },
  eventsCount: 12,
};

describe('SessionCard', () => {
  const queryClient = new QueryClient();

  const renderWithProviders = (component: React.ReactElement) => {
    return render(
      <QueryClientProvider client={queryClient}>
        {component}
      </QueryClientProvider>
    );
  };

  it('should render session information correctly', () => {
    renderWithProviders(<SessionCard session={mockSession} />);

    expect(screen.getByText('Test Article Title')).toBeInTheDocument();
    expect(screen.getByText('POST')).toBeInTheDocument();
    expect(screen.getByText('ARTICLE')).toBeInTheDocument();
    expect(screen.getByText('30 min')).toBeInTheDocument();
    expect(screen.getByText('12 events')).toBeInTheDocument();
  });

  it('should format date correctly', () => {
    renderWithProviders(<SessionCard session={mockSession} />);

    // Check for formatted date (will vary by locale)
    expect(screen.getByText(/15/)).toBeInTheDocument();
  });

  it('should show Continue and View Details buttons', () => {
    renderWithProviders(<SessionCard session={mockSession} />);

    expect(screen.getByText('Continue')).toBeInTheDocument();
    expect(screen.getByText('View Details')).toBeInTheDocument();
  });

  it('should handle session without finished time', () => {
    const activeSession = {
      ...mockSession,
      finishedAt: null,
      duration: null,
    };

    renderWithProviders(<SessionCard session={activeSession} />);

    expect(screen.queryByText(/min/)).not.toBeInTheDocument();
  });

  it('should apply correct phase color', () => {
    const { container } = renderWithProviders(<SessionCard session={mockSession} />);

    const phaseBadge = screen.getByText('POST');
    expect(phaseBadge).toHaveClass('bg-gray-100');
  });

  it('should render PRE phase with blue styling', () => {
    const preSession = { ...mockSession, phase: 'PRE' as const };
    renderWithProviders(<SessionCard session={preSession} />);

    const phaseBadge = screen.getByText('PRE');
    expect(phaseBadge).toHaveClass('bg-blue-100');
  });

  it('should render DURING phase with green styling', () => {
    const duringSession = { ...mockSession, phase: 'DURING' as const };
    renderWithProviders(<SessionCard session={duringSession} />);

    const phaseBadge = screen.getByText('DURING');
    expect(phaseBadge).toHaveClass('bg-green-100');
  });
});
