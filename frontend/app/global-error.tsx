'use client';

import { useEffect } from 'react';
import { reportError, createErrorContext } from '@/lib/utils/error-reporter';

/**
 * Global Error Handler
 * Catches errors in root layout.tsx and provides a fallback UI
 * Must include <html> and <body> tags as it replaces the entire app
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Report error to monitoring service
    reportError({
      error,
      context: createErrorContext({
        digest: error.digest,
        level: 'critical',
      }),
    });
  }, [error]);

  return (
    <html>
      <body>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          padding: '20px',
          fontFamily: 'system-ui, sans-serif',
          backgroundColor: '#f9fafb',
        }}>
          <div style={{
            maxWidth: '600px',
            textAlign: 'center',
            backgroundColor: 'white',
            padding: '40px',
            borderRadius: '8px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          }}>
            <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '16px', color: '#dc2626' }}>
              Algo deu errado
            </h1>
            <p style={{ marginBottom: '24px', color: '#6b7280' }}>
              Ocorreu um erro inesperado. Tente recarregar a página ou entre em contato com o suporte se o problema persistir.
            </p>
            
            {process.env.NODE_ENV === 'development' && (
              <details style={{ 
                marginBottom: '24px', 
                textAlign: 'left', 
                padding: '16px', 
                backgroundColor: '#fef2f2',
                borderRadius: '4px',
                border: '1px solid #fecaca',
              }}>
                <summary style={{ cursor: 'pointer', fontWeight: '500', color: '#991b1b' }}>
                  Detalhes do erro (dev only)
                </summary>
                <pre style={{ 
                  marginTop: '12px', 
                  fontSize: '12px', 
                  overflow: 'auto',
                  color: '#7f1d1d',
                }}>
                  {error.message}
                  {error.digest && `\nDigest: ${error.digest}`}
                </pre>
              </details>
            )}

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button
                onClick={() => reset()}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: '500',
                }}
              >
                Tentar novamente
              </button>
              <button
                onClick={() => window.location.href = '/'}
                style={{
                  padding: '10px 20px',
                  backgroundColor: 'white',
                  color: '#374151',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: '500',
                }}
              >
                Voltar ao início
              </button>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
