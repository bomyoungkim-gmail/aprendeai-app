'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuthStore } from '@/stores/auth-store';
import api from '@/lib/api';
import { API_ENDPOINTS } from '@/lib/config/api';
import { ROUTES } from '@/lib/config/routes';
import { useRouter } from 'next/navigation';
import { Mail, Lock, Loader2 } from 'lucide-react';
import OAuthButton from '@/components/auth/OAuthButton';
import { useOAuth } from '@/hooks/use-oauth';
import { loginSchema, LoginFormData } from '@/lib/validation/auth-schemas';
import { AuthInput } from '@/components/auth/AuthInput';

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const setAuth = useAuthStore((state) => state.setAuth);
  const router = useRouter();
  const { loginWithGoogle, loginWithMicrosoft, isLoading: oauthLoading } = useOAuth();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    setError('');
    try {
      const res = await api.post(API_ENDPOINTS.AUTH.LOGIN, data);
      setAuth(res.data.access_token, res.data.user);
      
      // Role-based redirect
      const userRole = res.data.user.role;
      let redirectPath = ROUTES.DASHBOARD.HOME; // Default
      
      if (userRole === 'ADMIN') {
        redirectPath = '/admin';
      } else if (userRole === 'INSTITUTION_ADMIN') {
        redirectPath = '/institution/dashboard';
      } else if (userRole === 'FAMILY_OWNER') {
        redirectPath = '/parent';
      }
      
      router.push(redirectPath);
    } catch (err: any) {
      console.error(err);
      
      // Default error message
      let errorMessage = 'Erro ao realizar login';

      // Check specifically for 401 Unauthorized
      if (err.response?.status === 401) {
        errorMessage = 'Email ou senha inválidos.';
      } else {
        // Safe extraction for other errors
        if (err.response?.data) {
           const data = err.response.data;
           if (typeof data.message === 'string') {
              errorMessage = data.message;
           } else if (typeof data.message === 'object' && data.message !== null) {
              errorMessage = Array.isArray(data.message) ? data.message.join(', ') : JSON.stringify(data.message);
           } else if (data.error) {
              errorMessage = typeof data.error === 'string' ? data.error : JSON.stringify(data.error);
           }
        } else if (err.message) {
           errorMessage = err.message;
        }
      }
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">AprendeAI</h1>
          <p className="mt-2 text-sm text-gray-600">
            Acesse sua conta para continuar seus estudos
          </p>
        </div>

        <div className="bg-white p-8 shadow rounded-lg border border-gray-100">
          {/* OAuth Buttons */}
          <div className="space-y-3 mb-6">
            <OAuthButton
              provider="google"
              onClick={loginWithGoogle}
              isLoading={oauthLoading}
            />
            <OAuthButton
              provider="microsoft"
              onClick={loginWithMicrosoft}
              isLoading={oauthLoading}
            />
          </div>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-gray-500">
                Ou continue com email
              </span>
            </div>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            <AuthInput
              id="email"
              label="Email"
              type="email"
              placeholder="seu@email.com"
              icon={Mail}
              error={errors.email?.message}
              register={register}
            />

            <AuthInput
              id="password"
              label="Senha"
              type="password"
              placeholder="••••••••"
              icon={Lock}
              error={errors.password?.message}
              register={register}
            />

            <div className="flex items-center justify-end">
              <div className="text-sm">
                <a href="/forgot-password" className="font-medium text-blue-600 hover:text-blue-500">
                  Esqueceu sua senha?
                </a>
              </div>
            </div>

            {error && <div className="text-sm text-red-600 text-center">{error}</div>}

            <button
              type="submit"
              data-testid="login-btn"
              disabled={isLoading}
              className="flex w-full justify-center rounded-md border border-transparent bg-blue-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Entrando...
                </>
              ) : (
                'Entrar'
              )}
            </button>
          </form>
          
           <div className="mt-4 text-center">
              <p className="text-sm text-gray-600">
                Ainda não tem conta?{' '}
                <a href={ROUTES.AUTH.REGISTER} className="font-medium text-blue-600 hover:text-blue-500">
                  Registre-se
                </a>
              </p>
           </div>
        </div>
      </div>
    </div>
  );
}
