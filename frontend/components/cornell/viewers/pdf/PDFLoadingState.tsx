interface PDFLoadingStateProps {
  loading: boolean;
  error: string;
  fileUrl?: string;
}

/**
 * PDFLoadingState - Estados de carregamento e erro do PDF
 * 
 * Exibe:
 * - Loading spinner durante carregamento
 * - Mensagem de erro se falhar
 * - Mensagem se não houver arquivo
 */
export function PDFLoadingState({ loading, error, fileUrl }: PDFLoadingStateProps) {
  if (!fileUrl) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-500">No PDF file available</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-white">Loading PDF...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-900 p-4">
        <div className="text-red-400 text-center max-w-md">
          <svg 
            className="h-12 w-12 sm:h-16 sm:w-16 mx-auto mb-4" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" 
            />
          </svg>
          <p className="text-base sm:text-lg font-semibold mb-2">Failed to load PDF</p>
          <p className="text-xs sm:text-sm text-gray-400 mb-2">
            {error}
          </p>
          <p className="text-xs text-gray-500">
            Please check your internet connection and try again
          </p>
        </div>
      </div>
    );
  }

  return null;
}
