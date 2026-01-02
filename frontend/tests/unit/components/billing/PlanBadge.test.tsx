import { render, screen } from '@testing-library/react';
import { PlanBadge } from '@/components/billing/PlanBadge';
import { useEntitlements } from '@/hooks/billing/use-entitlements';

// Mock hook
jest.mock('@/hooks/billing/use-entitlements', () => ({
  useEntitlements: jest.fn(),
  PlanType: {
    FREE: 'FREE',
    INDIVIDUAL_PREMIUM: 'INDIVIDUAL_PREMIUM',
  }
}));

describe('PlanBadge Component', () => {
  it('renders loading state initially', () => {
    (useEntitlements as jest.Mock).mockReturnValue({
      activePlan: undefined,
      isLoading: true,
    });

    const { container } = render(<PlanBadge />);
    // Expect pulse animation class or skeleton
    expect(container.firstChild).toHaveClass('animate-pulse');
  });

  it('renders Free plan badge correctly', () => {
    (useEntitlements as jest.Mock).mockReturnValue({
      activePlan: 'FREE',
      isLoading: false,
    });

    render(<PlanBadge />);
    expect(screen.getByText('Free Plan')).toBeInTheDocument();
    expect(screen.getByText('Free Plan').parentElement).toHaveClass('bg-gray-100');
  });

  it('renders Premium plan badge accurately', () => {
    (useEntitlements as jest.Mock).mockReturnValue({
      activePlan: 'INDIVIDUAL_PREMIUM',
      isLoading: false,
    });

    render(<PlanBadge />);
    expect(screen.getByText('Premium')).toBeInTheDocument();
    // Check for color class specific to premium
    expect(screen.getByText('Premium').parentElement).toHaveClass('bg-purple-100');
  });
});
