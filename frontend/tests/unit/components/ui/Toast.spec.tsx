/**
 * Toast Component & Hook Tests
 * 
 * Comprehensive tests for Toast UI and functionality
 */

import { render, screen, fireEvent, renderHook, act } from '@testing-library/react';
import { Toast, useToast } from '@/components/ui/Toast';

describe('Toast Component', () => {
  const defaultProps = {
    type: 'success' as const,
    message: 'Operation successful',
    onClose: jest.fn(),
  };

  it('should render message correctly', () => {
    render(<Toast {...defaultProps} />);
    expect(screen.getByText('Operation successful')).toBeInTheDocument();
  });

  it('should apply success styles', () => {
    render(<Toast {...defaultProps} type="success" />);
    // Check for specific class or just that it renders without error.
    // Testing specific classes is brittle but valid for ui libs.
    const message = screen.getByText('Operation successful');
    // Using parentElement to check container classes
    expect(message.parentElement).toHaveClass('bg-green-50');
  });

  it('should apply error styles', () => {
    render(<Toast {...defaultProps} type="error" />);
    const message = screen.getByText('Operation successful');
    expect(message.parentElement).toHaveClass('bg-red-50');
  });

  it('should call onClose when close button is clicked', () => {
    render(<Toast {...defaultProps} />);
    const closeBtn = screen.getByRole('button');
    fireEvent.click(closeBtn);
    expect(defaultProps.onClose).toHaveBeenCalled();
  });
});

describe('useToast Hook', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should initialize with null toast', () => {
    const { result } = renderHook(() => useToast());
    expect(result.current.toast).toBeNull();
  });

  it('should show toast with message and type', () => {
    const { result } = renderHook(() => useToast());

    act(() => {
      result.current.success('Success message');
    });

    expect(result.current.toast).toEqual({
      type: 'success',
      message: 'Success message',
    });
  });

  it('should auto-hide after duration', () => {
    const { result } = renderHook(() => useToast());

    act(() => {
      result.current.show('error', 'Error message', 1000);
    });

    expect(result.current.toast).not.toBeNull();

    act(() => {
      jest.advanceTimersByTime(1000);
    });

    expect(result.current.toast).toBeNull();
  });

  it('should hide manually', () => {
    const { result } = renderHook(() => useToast());

    act(() => {
      result.current.info('Info');
    });

    expect(result.current.toast).not.toBeNull();

    act(() => {
      result.current.hide();
    });

    expect(result.current.toast).toBeNull();
  });
});
