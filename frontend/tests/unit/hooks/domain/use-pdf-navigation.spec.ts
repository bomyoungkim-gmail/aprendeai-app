import { renderHook, act } from '@testing-library/react';
import { usePDFNavigation } from '@/hooks/pdf/use-pdf-navigation';

describe('usePDFNavigation', () => {
  const totalPages = 10;
  let mockViewerRef: any;

  beforeEach(() => {
    mockViewerRef = {
      current: {
        jumpToPage: jest.fn(),
      },
    };
  });

  it('should initialize with page 1', () => {
    const { result } = renderHook(() => usePDFNavigation(totalPages));
    expect(result.current.currentPage).toBe(1);
  });

  it('should jump to a specific page', () => {
    const { result } = renderHook(() => usePDFNavigation(totalPages));
    
    // Inject mock ref
    result.current.viewerRef.current = mockViewerRef.current;

    act(() => {
      result.current.goToPage(5);
    });

    expect(result.current.currentPage).toBe(5);
    expect(mockViewerRef.current.jumpToPage).toHaveBeenCalledWith(4); // 0-indexed
  });

  it('should not jump to invalid pages', () => {
    const { result } = renderHook(() => usePDFNavigation(totalPages));
    result.current.viewerRef.current = mockViewerRef.current;

    act(() => {
      result.current.goToPage(0);
      result.current.goToPage(11);
    });

    expect(result.current.currentPage).toBe(1);
    expect(mockViewerRef.current.jumpToPage).not.toHaveBeenCalled();
  });

  it('should navigate to next page', () => {
    const { result } = renderHook(() => usePDFNavigation(totalPages));
    result.current.viewerRef.current = mockViewerRef.current;

    act(() => {
      result.current.nextPage();
    });

    expect(result.current.currentPage).toBe(2);
    expect(mockViewerRef.current.jumpToPage).toHaveBeenCalledWith(1);
  });

  it('should not next page if on last page', () => {
    const { result } = renderHook(() => usePDFNavigation(totalPages));
    result.current.viewerRef.current = mockViewerRef.current;

    act(() => {
      result.current.goToPage(10);
    });

    act(() => {
      result.current.nextPage();
    });

    expect(result.current.currentPage).toBe(10);
    expect(mockViewerRef.current.jumpToPage).toHaveBeenCalledTimes(1); // Only for goToPage
  });

  it('should navigate to previous page', () => {
    const { result } = renderHook(() => usePDFNavigation(totalPages));
    result.current.viewerRef.current = mockViewerRef.current;

    act(() => {
      result.current.goToPage(3);
    });

    act(() => {
      result.current.previousPage();
    });

    expect(result.current.currentPage).toBe(2);
    expect(mockViewerRef.current.jumpToPage).toHaveBeenCalledWith(1);
  });

  it('should handle page change from viewer event', () => {
    const { result } = renderHook(() => usePDFNavigation(totalPages));
    const mockOnPageChange = jest.fn();

    act(() => {
      result.current.handlePageChange({ currentPage: 2 }, mockOnPageChange); // 0-indexed input
    });

    expect(result.current.currentPage).toBe(3);
    expect(mockOnPageChange).toHaveBeenCalledWith(3);
  });

  it('should handle document load to set total pages', () => {
    const { result } = renderHook(() => usePDFNavigation(0)); // Initial 0
    const mockSetTotalPages = jest.fn();

    act(() => {
      result.current.handleDocumentLoad({ doc: { numPages: 20 } }, mockSetTotalPages);
    });

    expect(mockSetTotalPages).toHaveBeenCalledWith(20);
  });

  it('should execute jumpToHighlight callback', () => {
    const { result } = renderHook(() => usePDFNavigation(totalPages));
    const mockCallback = jest.fn();
    const mockArea = { pageIndex: 1 };

    result.current.jumpToHighlightAreaRef.current = mockCallback;

    act(() => {
      result.current.jumpToHighlight(mockArea);
    });

    expect(mockCallback).toHaveBeenCalledWith(mockArea);
  });
});
