'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { ROUTES } from '@/lib/config/routes';
import { reportError, createErrorContext } from '@/lib/utils/error-reporter';
import { AlertTriangle, UserPlus, RotateCcw } from 'lucide-react';

/**
 * Register Error Boundary
 * Catches errors in registration flow
 */
export default function RegisterError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Report error
    reportError({
      error,
      context: createErrorContext({
        digest: error.digest,
        area: 'registration',
      }),
    });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="rounded-lg bg-white p-8 shadow-lg">
          {/* Error Icon */}
          <div className="mb-6 flex justify-center">
            <div className="rounded-full bg-yellow-100 p-4">
              <AlertTriangle className="h-12 w-12 text-yellow-600" />
            </div>
          </div>

          {/* Error Title */}
          <h1 className="mb-4 text-center text-2xl font-bold text-gray-900">
            Erro no Cadastro
          </h1>

          {/* Error Description */}
          <p className="mb-6 text-center text-gray-600">
            Ocorreu um problema ao criar sua conta. Por favor, tente novamente.
          </p>

          {/* Development Error Details */}
          {process.env.NODE_ENV === 'development' && (
            <details className="mb-6 rounded-lg border border-yellow-200 bg-yellow-50 p-4">
              <summary className="cursor-pointer font-medium text-yellow-900">
                Detalhes do erro (ambiente de desenvolvimento)
              </summary>
              <div className="mt-4 space-y-2">
                <p className="text-sm text-yellow-700">{error.message}</p>
                {error.digest && (
                  <p className="font-mono text-xs text-yellow-700">Digest: {error.digest}</p>
                )}
              </div>
            </details>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col gap-3">
            <button
              onClick={() => reset()}
              className="inline-flex items-center justify-center rounded-md bg-blue-600 px-6 py-3 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              Tentar novamente
            </button>
            <Link
              href={ROUTES.AUTH.REGISTER}
              className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-6 py-3 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              <UserPlus className="mr-2 h-4 w-4" />
              Voltar para o Cadastro
            </Link>
          </div>

          {/* Support Message */}
          <div className="mt-6 text-center text-sm text-gray-600">
            Precisa de ajuda?{' '}
            <a href="mailto:support@aprendeai.com" className="font-medium text-blue-600 hover:text-blue-500">
              Entre em contato
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
