'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/stores/auth-store';
import { ROUTES, ROUTES_WITH_PARAMS, ROUTE_ERRORS } from '@/lib/config/routes';

export default function AuthCallback() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const token = searchParams?.get('token');
    const error = searchParams?.get('error');
    
    if (token) {
      // Store JWT token
      localStorage.setItem('token', token);
      
      // Redirect to dashboard
      router.push(ROUTES.DASHBOARD.HOME);
    } else if (error) {
      // OAuth failed
      console.error('OAuth error:', error);
      router.push(ROUTES_WITH_PARAMS.LOGIN_WITH_ERROR(ROUTE_ERRORS.OAUTH_FAILED));
    } else {
      // No token or error - something went wrong
      router.push(ROUTES_WITH_PARAMS.LOGIN_WITH_ERROR(ROUTE_ERRORS.INVALID_CALLBACK));
    }
  }, [searchParams, router]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Completing login...
        </h2>
        <p className="text-gray-600">
          Please wait while we sign you in
        </p>
      </div>
    </div>
  );
}
