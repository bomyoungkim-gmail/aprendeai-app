import { renderHook, act } from '@testing-library/react';
import { usePDFHighlights } from '@/hooks/pdf/use-pdf-highlights';

// Mock adapters
jest.mock('@/lib/adapters/highlight-adapter', () => ({
  __esModule: true,
  convertHighlightsToReactPDF: jest.fn((highlights) => highlights.map((h: any) => ({
    id: h.id,
    position: { pageIndex: 0 },
    highlightAreas: [{ left: 10, top: 10, width: 20, height: 5, pageIndex: 0 }]
  }))),
  reactPDFToBackend: jest.fn(() => ({ id: 'new-highlight' }))
}));

// Mock colors
jest.mock('@/lib/constants/colors', () => ({
  __esModule: true,
  getColorForKey: jest.fn(() => '#ff0000')
}));

// Mock logger
jest.mock('@/lib/utils/logger', () => ({
  logger: {
    error: jest.fn()
  }
}));

import { convertHighlightsToReactPDF, reactPDFToBackend } from '@/lib/adapters/highlight-adapter';
import { logger } from '@/lib/utils/logger';

import { ContentType } from '@/lib/constants/enums';
import type { Highlight as BackendHighlight } from '@/lib/types/cornell';

describe('usePDFHighlights', () => {
  const mockHighlights: BackendHighlight[] = [
    { 
      id: '1', 
      contentId: 'content-1',
      userId: 'user-1',
      kind: 'TEXT' as const,
      targetType: ContentType.PDF,
      colorKey: 'yellow',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      tagsJson: [],
      status: 'ACTIVE' as const,
      user: { id: 'user-1', name: 'User', email: 'user@test.com' }
    } as any
  ];
  const mockCreateHighlight = jest.fn();
  const mockContentId = 'content-1';

  beforeEach(() => {
    jest.clearAllMocks();
    (convertHighlightsToReactPDF as jest.Mock).mockReturnValue([
      {
        id: '1',
        position: { pageIndex: 0 },
        highlightAreas: [{ left: 10, top: 10, width: 20, height: 5, pageIndex: 0 }],
        content: { text: 'test' },
        colorKey: 'yellow'
      }
    ]);
  });

  it('should initialize and convert highlights', () => {
    const { result } = renderHook(() => 
      usePDFHighlights(mockHighlights, mockCreateHighlight, 'yellow', mockContentId)
    );

    expect(convertHighlightsToReactPDF).toHaveBeenCalledWith(mockHighlights);
    expect(result.current.reactPDFHighlights).toHaveLength(1);
    expect(result.current.reactPDFHighlights[0].id).toBe('1');
  });

  it('should handle highlight creation with single area', async () => {
    const { result } = renderHook(() => 
      usePDFHighlights(mockHighlights, mockCreateHighlight, 'yellow', mockContentId)
    );

    const mockArea = {
      selectionRegion: { left: 10, top: 10, width: 50, height: 10, pageIndex: 0 },
      selectedText: 'Select text',
      pageIndex: 0
    };

    await act(async () => {
      await result.current.handleHighlightCreation(mockArea);
    });

    expect(reactPDFToBackend).toHaveBeenCalled();
    expect(mockCreateHighlight).toHaveBeenCalled();
  });

  it('should handle highlight creation with multi-line areas', async () => {
    const { result } = renderHook(() => 
      usePDFHighlights(mockHighlights, mockCreateHighlight, 'yellow', mockContentId)
    );

    const mockArea = {
      selectionRegion: { left: 10, top: 10, width: 50, height: 10, pageIndex: 0 },
      selectedText: 'Multi line text',
      highlightAreas: [
        { left: 10, top: 10, width: 50, height: 5, pageIndex: 0 },
        { left: 10, top: 15, width: 30, height: 5, pageIndex: 0 }
      ]
    };

    await act(async () => {
      await result.current.handleHighlightCreation(mockArea);
    });

    expect(reactPDFToBackend).toHaveBeenCalledWith(
      expect.objectContaining({
        highlightAreas: expect.arrayContaining([
          expect.objectContaining({ width: 50 }),
          expect.objectContaining({ width: 30 })
        ])
      }),
      mockContentId,
      '',
      'yellow'
    );
    expect(mockCreateHighlight).toHaveBeenCalled();
  });

  it('should handle highlight creation failure', async () => {
    const error = new Error('Creation failed');
    mockCreateHighlight.mockRejectedValueOnce(error);

    const { result } = renderHook(() => 
      usePDFHighlights(mockHighlights, mockCreateHighlight, 'yellow', mockContentId)
    );

    const mockArea = {
      selectionRegion: { left: 10, top: 10, width: 50, height: 10, pageIndex: 0 },
      selectedText: 'Fail text'
    };

    await act(async () => {
      await result.current.handleHighlightCreation(mockArea);
    });

    expect(logger.error).toHaveBeenCalledWith(
      'Failed to create highlight',
      error,
      expect.objectContaining({ contentId: mockContentId })
    );
  });

  it('should filter out invalid highlight areas', async () => {
    const { result } = renderHook(() => 
      usePDFHighlights(mockHighlights, mockCreateHighlight, 'yellow', mockContentId)
    );

    const mockArea = {
      selectionRegion: { left: 10, top: 10, width: 50, height: 10, pageIndex: 0 },
      selectedText: 'Filter text',
      highlightAreas: [
        { left: 10, top: 10, width: 0, height: 5, pageIndex: 0 }, // Invalid width
        { left: 10, top: 15, width: 30, height: 5, pageIndex: 0 } // Valid
      ]
    };

    await act(async () => {
      await result.current.handleHighlightCreation(mockArea);
    });

    // Should only have 1 valid area in result passed to backend adapter
    expect(reactPDFToBackend).toHaveBeenCalled();
    const callArgs = (reactPDFToBackend as jest.Mock).mock.calls[0][0];
    expect(callArgs.highlightAreas).toHaveLength(1);
    expect(callArgs.highlightAreas[0].width).toBe(30);
  });

  it('should fallback to selection region if all areas filtered', async () => {
    const { result } = renderHook(() => 
      usePDFHighlights(mockHighlights, mockCreateHighlight, 'yellow', mockContentId)
    );

    const mockArea = {
      selectionRegion: { left: 10, top: 10, width: 50, height: 10, pageIndex: 0 },
      selectedText: 'Fallback text',
      highlightAreas: [
        { left: 10, top: 10, width: 0, height: 5, pageIndex: 0 } // Invalid
      ]
    };

    await act(async () => {
      await result.current.handleHighlightCreation(mockArea);
    });

    expect(reactPDFToBackend).toHaveBeenCalled();
    const callArgs = (reactPDFToBackend as jest.Mock).mock.calls[0][0];
    expect(callArgs.highlightAreas).toHaveLength(1);
    expect(callArgs.highlightAreas[0].width).toBe(50); // Fallback to region width
  });
});
