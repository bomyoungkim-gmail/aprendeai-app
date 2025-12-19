'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

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
      router.push('/dashboard');
    } else if (error) {
      // OAuth failed
      console.error('OAuth error:', error);
      router.push('/login?error=oauth_failed');
    } else {
      // No token or error - something went wrong
      router.push('/login?error=invalid_callback');
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
