'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/stores/auth-store';
import { ROUTES } from '@/lib/config/routes';
import { reportError, createErrorContext } from '@/lib/utils/error-reporter';
import { FileQuestion, Home, LogIn } from 'lucide-react';

/**
 * Global Not Found (404) Handler
 * Shows authentication-aware 404 page with appropriate navigation
 */
export default function NotFound() {
  const { token, user } = useAuthStore();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Check authentication status
    setIsAuthenticated(!!token);

    // Report 404 for monitoring
    reportError({
      error: new Error('404 - Page Not Found'),
      context: createErrorContext({
        userId: user?.id,
        isAuthenticated: !!token,
      }),
    });
  }, [token, user]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md text-center">
        <div className="mb-8 flex justify-center">
          <div className="rounded-full bg-blue-100 p-6">
            <FileQuestion className="h-16 w-16 text-blue-600" />
          </div>
        </div>

        <h1 className="mb-2 text-4xl font-bold text-gray-900">404</h1>
        <h2 className="mb-4 text-xl font-semibold text-gray-700">Página não encontrada</h2>
        <p className="mb-8 text-gray-600">
          A página que você está procurando não existe ou foi movida.
        </p>

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          {isAuthenticated ? (
            <>
              <Link
                href={ROUTES.DASHBOARD.HOME}
                className="inline-flex items-center justify-center rounded-md bg-blue-600 px-6 py-3 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                <Home className="mr-2 h-4 w-4" />
                Voltar ao Dashboard
              </Link>
              <Link
                href={ROUTES.HOME}
                className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-6 py-3 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Ir para o início
              </Link>
            </>
          ) : (
            <>
              <Link
                href={ROUTES.AUTH.LOGIN}
                className="inline-flex items-center justify-center rounded-md bg-blue-600 px-6 py-3 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                <LogIn className="mr-2 h-4 w-4" />
                Fazer Login
              </Link>
              <Link
                href={ROUTES.HOME}
                className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-6 py-3 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Ir para o início
              </Link>
            </>
          )}
        </div>

        {/* Debug info in development */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-8 rounded-lg bg-yellow-50 p-4 text-left">
            <p className="text-sm font-medium text-yellow-800">Debug Info:</p>
            <p className="text-xs text-yellow-700">
              Authenticated: {isAuthenticated ? 'Yes' : 'No'}
              <br />
              Path: {typeof window !== 'undefined' ? window.location.pathname : 'unknown'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
