import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { EducationalPDFViewer } from '@/components/cornell/EducationalPDFViewer';
import { ReadingProgressBar } from '@/components/cornell/ReadingProgressBar';

describe('ReadingProgressBar', () => {
  it('should render with correct width based on progress', () => {
    render(<ReadingProgressBar progress={50} />);
    
    const progressBar = screen.getByRole('progressbar');
    const indicator = progressBar.firstElementChild;
    
    expect(progressBar).toHaveAttribute('aria-valuenow', '50');
    expect(indicator).toHaveStyle({ width: '50%' });
  });

  it('should clamp values between 0 and 100', () => {
    render(<ReadingProgressBar progress={150} />);
    
    const progressBar = screen.getByRole('progressbar');
    expect(progressBar).toHaveAttribute('aria-valuenow', '100');
  });
});

describe('EducationalPDFViewer', () => {
  it('should render children correctly', () => {
    render(
      <EducationalPDFViewer>
        <div data-testid="child-content">PDF Content</div>
      </EducationalPDFViewer>
    );

    expect(screen.getByTestId('child-content')).toBeInTheDocument();
  });

  it('should apply correct theme output classes', () => {
    const { rerender } = render(
      <EducationalPDFViewer theme="sepia">
        Content
      </EducationalPDFViewer>
    );

    const contentArea = screen.getByTestId('educational-viewer-content');
    expect(contentArea.className).toContain('bg-amber-50');

    rerender(
      <EducationalPDFViewer theme="dark">
        Content
      </EducationalPDFViewer>
    );
    expect(contentArea.className).toContain('bg-gray-900');
  });

  it('should show progress bar by default', () => {
    render(
      <EducationalPDFViewer>
        <div style={{ height: '2000px' }}>Long Content</div>
      </EducationalPDFViewer>
    );

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('should hide progress bar when showProgressBar is false', () => {
    render(
      <EducationalPDFViewer showProgressBar={false}>
        Content
      </EducationalPDFViewer>
    );

    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
  });
});
