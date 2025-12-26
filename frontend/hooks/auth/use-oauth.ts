import { useState } from 'react';
import { API_BASE_URL, API_ENDPOINTS } from '@/lib/config/api';

export function useOAuth() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loginWithGoogle = () => {
    setIsLoading(true);
    setError(null);
    
    // Redirect to backend OAuth endpoint
    window.location.href = `${API_BASE_URL}${API_ENDPOINTS.AUTH.GOOGLE}`;
  };

  const loginWithMicrosoft = () => {
    setIsLoading(true);
    setError(null);
    
    // Redirect to backend OAuth endpoint
    window.location.href = `${API_BASE_URL}${API_ENDPOINTS.AUTH.MICROSOFT}`;
  };

  const handleOAuthCallback = () => {
    // This runs after OAuth redirect back to app
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    const errorParam = params.get('error');

    if (errorParam) {
      setError(errorParam);
      setIsLoading(false);
      return null;
    }

    if (token) {
      // Store JWT token
      localStorage.setItem('authToken', token);
      setIsLoading(false);
      return token;
    }

    return null;
  };

  return {
    loginWithGoogle,
    loginWithMicrosoft,
    handleOAuthCallback,
    isLoading,
    error,
  };
}
