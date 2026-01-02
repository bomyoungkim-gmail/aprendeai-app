import { useState, useEffect } from 'react';
import { logger } from '@/lib/utils/logger';

/**
 * usePDFDocument - Hook para gerenciar carregamento de documentos PDF
 * 
 * Responsabilidades:
 * - Fetch do PDF com autenticação
 * - Criação de Blob URL
 * - Gerenciamento de loading/error states
 * - Cleanup de Blob URL
 * 
 * @param fileUrl - URL do arquivo PDF
 * @returns Estado do documento (pdfUrl, loading, error, refetch)
 */
export function usePDFDocument(fileUrl: string | undefined) {
  const [pdfUrl, setPdfUrl] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (!fileUrl) {
      setError('No file URL provided');
      setLoading(false);
      return;
    }

    const fetchPDF = async () => {
      try {
        setLoading(true);
        // Get token from store directly to ensure we have value even if localStorage format is different
        const { useAuthStore } = await import('@/stores/auth-store');
        const token = useAuthStore.getState().token;
        
        if (!token) {
          logger.error('PDF Fetch: No token found in auth store');
          throw new Error('Authentication token missing. Please log in again.');
        }

        logger.debug('PDF Fetch: Starting request', { fileUrl });
        
        const response = await fetch(fileUrl, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error(`Failed to load PDF: ${response.statusText}`);
        }

        const blob = await response.blob();
        const blobUrl = URL.createObjectURL(blob);
        setPdfUrl(blobUrl);
        setError('');
      } catch (err) {
        logger.error('PDF fetch failed', err, { fileUrl });
        setError(err instanceof Error ? err.message : 'Failed to load PDF');
      } finally {
        setLoading(false);
      }
    };

    fetchPDF();

    // Cleanup blob URL on unmount
    return () => {
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
      }
    };
  }, [fileUrl]);

  const refetch = () => {
    if (fileUrl) {
      setLoading(true);
      setError('');
    }
  };

  return {
    pdfUrl,
    loading,
    error,
    refetch,
  };
}
