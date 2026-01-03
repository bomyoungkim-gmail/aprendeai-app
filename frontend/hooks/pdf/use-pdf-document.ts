import { useState, useEffect } from 'react';
import { logger } from '@/lib/utils/logger';
import { api } from '@/lib/api';

/**
 * usePDFDocument - Hook para gerenciar carregamento de documentos PDF
 * 
 * Responsabilidades:
 * - Fetch do PDF com autenticação usando a instância 'api' configurada
 * - Criação de Blob URL
 * - Gerenciamento de loading/error states
 * - Cleanup de Blob URL
 * 
 * @param fileUrl - URL do arquivo PDF (ex: /files/id/view)
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

    let currentBlobUrl = '';

    const fetchPDF = async () => {
      try {
        setLoading(true);
        logger.debug('PDF Fetch: Starting request via axios', { fileUrl });
        
        // A instância 'api' já contém baseURL e injeta o token JWT via interceptors
        const response = await api.get(fileUrl, {
          responseType: 'blob',
        });

        const blob = response.data;
        
        // Robust validation: Check file type first
        if (blob.type !== 'application/pdf') {
          // If it's a small file, it might be a JSON error response
          if (blob.size < 1000) {
            const text = await blob.text();
            try {
              const json = JSON.parse(text);
              throw new Error(json.message || 'Server returned an error instead of a PDF');
            } catch (parseError) {
              // If it's not JSON, throw generic error
              throw new Error(`Invalid file type received: ${blob.type}. Expected application/pdf`);
            }
          }
          // If it's a large non-PDF file, reject it
          throw new Error(`Invalid file type: ${blob.type}. Expected application/pdf`);
        }

        const blobUrl = URL.createObjectURL(blob);
        currentBlobUrl = blobUrl;
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

    // Cleanup blob URL on unmount or fileUrl change
    return () => {
      if (currentBlobUrl) {
        URL.revokeObjectURL(currentBlobUrl);
      }
    };
  }, [fileUrl]);

  return {
    pdfUrl,
    loading,
    error,
  };
}
