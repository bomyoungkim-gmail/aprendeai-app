'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth-store';
import { ROUTES } from '@/lib/config/routes';
import { reportError, createErrorContext } from '@/lib/utils/error-reporter';
import { AlertCircle, Home, RotateCcw } from 'lucide-react';

/**
 * Dashboard Error Boundary
 * Catches errors within dashboard routes (authenticated users)
 */
export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();
  const { user } = useAuthStore();

  useEffect(() => {
    // Report error with user context
    reportError({
      error,
      context: createErrorContext({
        userId: user?.id,
        userEmail: user?.email,
        digest: error.digest,
        area: 'dashboard',
      }),
    });
  }, [error, user]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12">
      <div className="w-full max-w-2xl">
        <div className="rounded-lg bg-white p-8 shadow-lg">
          {/* Error Icon */}
          <div className="mb-6 flex justify-center">
            <div className="rounded-full bg-red-100 p-4">
              <AlertCircle className="h-12 w-12 text-red-600" />
            </div>
          </div>

          {/* Error Title */}
          <h1 className="mb-4 text-center text-2xl font-bold text-gray-900">
            Ops! Algo deu errado
          </h1>

          {/* Error Description */}
          <p className="mb-6 text-center text-gray-600">
            Encontramos um erro inesperado. Nossa equipe foi notificada e está trabalhando para resolver o problema.
          </p>

          {/* Development Error Details */}
          {process.env.NODE_ENV === 'development' && (
            <details className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4">
              <summary className="cursor-pointer font-medium text-red-900">
                Detalhes do erro (ambiente de desenvolvimento)
              </summary>
              <div className="mt-4 space-y-2">
                <div>
                  <p className="text-sm font-medium text-red-800">Mensagem:</p>
                  <p className="text-sm text-red-700">{error.message}</p>
                </div>
                {error.digest && (
                  <div>
                    <p className="text-sm font-medium text-red-800">Digest:</p>
                    <p className="font-mono text-xs text-red-700">{error.digest}</p>
                  </div>
                )}
                {error.stack && (
                  <div>
                    <p className="text-sm font-medium text-red-800">Stack Trace:</p>
                    <pre className="mt-1 max-h-48 overflow-auto rounded bg-red-100 p-2 font-mono text-xs text-red-700">
                      {error.stack}
                    </pre>
                  </div>
                )}
              </div>
            </details>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
            <button
              onClick={() => reset()}
              className="inline-flex items-center justify-center rounded-md bg-blue-600 px-6 py-3 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              Tentar novamente
            </button>
            <button
              onClick={() => router.push(ROUTES.DASHBOARD.HOME)}
              className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-6 py-3 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              <Home className="mr-2 h-4 w-4" />
              Voltar ao Dashboard
            </button>
          </div>

          {/* Support Message */}
          <div className="mt-6 rounded-lg bg-blue-50 p-4">
            <p className="text-center text-sm text-blue-800">
              Se o problema persistir, entre em contato com o suporte em{' '}
              <a href="mailto:support@aprendeai.com" className="font-medium underline">
                support@aprendeai.com
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
