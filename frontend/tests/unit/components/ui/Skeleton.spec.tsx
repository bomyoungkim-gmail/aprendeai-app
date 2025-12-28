/**
 * Skeleton Component Tests
 * 
 * Comprehensive test suite for Skeleton loading component
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Skeleton } from '@/components/ui/skeleton';

describe('Skeleton', () => {
  describe('Rendering', () => {
    it('should render skeleton element', () => {
      const { container } = render(<Skeleton />);
      const skeleton = container.firstChild;
      expect(skeleton).toBeInTheDocument();
    });

    it('should have animate-pulse class', () => {
      const { container } = render(<Skeleton />);
      const skeleton = container.firstChild as HTMLElement;
      expect(skeleton).toHaveClass('animate-pulse');
    });

    it('should have rounded class', () => {
      const { container } = render(<Skeleton />);
      const skeleton = container.firstChild as HTMLElement;
      expect(skeleton).toHaveClass('rounded-md');
    });

    it('should have background color class', () => {
      const { container } = render(<Skeleton />);
      const skeleton = container.firstChild as HTMLElement;
      expect(skeleton).toHaveClass('bg-muted');
    });
  });

  describe('Custom Props', () => {
    it('should accept and apply custom className', () => {
      const { container } = render(<Skeleton className="custom-skeleton" />);
      const skeleton = container.firstChild as HTMLElement;
      expect(skeleton).toHaveClass('custom-skeleton');
    });

    it('should merge custom className with default classes', () => {
      const { container } = render(<Skeleton className="h-20 w-20" />);
      const skeleton = container.firstChild as HTMLElement;
      expect(skeleton).toHaveClass('animate-pulse');
      expect(skeleton).toHaveClass('h-20');
      expect(skeleton).toHaveClass('w-20');
    });
  });

  describe('Common Use Cases', () => {
    it('should render as card skeleton', () => {
      const { container } = render(<Skeleton className="h-32 w-full" />);
      const skeleton = container.firstChild as HTMLElement;
      expect(skeleton).toHaveClass('h-32');
      expect(skeleton).toHaveClass('w-full');
    });

    it('should render as text skeleton', () => {
      const { container } = render(<Skeleton className="h-4 w-3/4" />);
      const skeleton = container.firstChild as HTMLElement;
      expect(skeleton).toHaveClass('h-4');
      expect(skeleton).toHaveClass('w-3/4');
    });

    it('should render as circle skeleton', () => {
      const { container } = render(<Skeleton className="h-12 w-12 rounded-full" />);
      const skeleton = container.firstChild as HTMLElement;
      expect(skeleton).toHaveClass('h-12');
      expect(skeleton).toHaveClass('w-12');
      expect(skeleton).toHaveClass('rounded-full');
    });
  });

  describe('Multiple Skeletons', () => {
    it('should render multiple skeletons', () => {
      const { container } = render(
        <div>
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      );
      
      const skeletons = container.querySelectorAll('.animate-pulse');
      expect(skeletons).toHaveLength(3);
    });
  });

  describe('Loading State Pattern', () => {
    it('should work in conditional rendering', () => {
      const { rerender } = render(
        <div data-testid="content">
          <Skeleton className="h-20 w-full" />
        </div>
      );
      
      expect(screen.getByTestId('content').querySelector('.animate-pulse')).toBeInTheDocument();
      
      rerender(
        <div data-testid="content">
          <div>Loaded content</div>
        </div>
      );
      
      expect(screen.getByText('Loaded content')).toBeInTheDocument();
      expect(screen.getByTestId('content').querySelector('.animate-pulse')).not.toBeInTheDocument();
    });
  });
});
