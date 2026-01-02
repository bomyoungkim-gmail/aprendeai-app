import { renderHook, act, waitFor } from '@testing-library/react';
import { usePDFDocument } from '@/hooks/pdf/use-pdf-document';
import { useAuthStore } from '@/stores/auth-store';

// Mock auth store
jest.mock('@/stores/auth-store', () => ({
  useAuthStore: Object.assign(jest.fn(), {
    getState: jest.fn(() => ({
      token: 'test-token',
    })),
  }),
}));

// Mock global fetch
global.fetch = jest.fn();

describe('usePDFDocument', () => {
  const mockToken = 'test-token';
  const mockUrl = 'https://example.com/test.pdf';

  beforeEach(() => {
    jest.clearAllMocks();
    (useAuthStore as unknown as jest.Mock).mockReturnValue({
      token: mockToken,
    });
    (useAuthStore.getState as jest.Mock).mockReturnValue({
      token: mockToken,
    });
    (global.fetch as jest.Mock).mockReset();
  });

  it('should initialize with default states', () => {
    const { result } = renderHook(() => usePDFDocument(undefined));

    expect(result.current.pdfUrl).toBe(''); // Initial state is empty string from viewing file
    expect(result.current.loading).toBe(false); // Loading stops if no URL
    expect(result.current.error).toBe('No file URL provided'); // Error set for undefined URL
  });

  it('should fetch PDF with auth token when url is provided', async () => {
    const mockBlob = new Blob(['pdf-content'], { type: 'application/pdf' });
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      blob: async () => mockBlob,
    });

    // Mock URL.createObjectURL
    global.URL.createObjectURL = jest.fn(() => 'blob:test-url');

    const { result } = renderHook(() => usePDFDocument(mockUrl));

    expect(result.current.loading).toBe(true);
    expect(result.current.error).toBe('');

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.pdfUrl).toBe('blob:test-url');
    });

    expect(global.fetch).toHaveBeenCalledWith(
      mockUrl,
      expect.objectContaining({
        headers: {
          Authorization: `Bearer ${mockToken}`,
        },
      })
    );
  });

  it('should handle fetch error correctly', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 404,
      statusText: 'Not Found',
    });

    const { result } = renderHook(() => usePDFDocument(mockUrl));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe('Failed to load PDF: Not Found');
      expect(result.current.pdfUrl).toBeNull();
    });
  });

  it('should handle network error correctly', async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

    const { result } = renderHook(() => usePDFDocument(mockUrl));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe('Network error');
      expect(result.current.pdfUrl).toBeNull();
    });
  });


});
