'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuthStore } from '@/stores/auth-store';
import api from '@/lib/api';
import { API_BASE_URL, API_ENDPOINTS } from '@/lib/config/api';
import { ROUTES } from '@/lib/config/routes';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Loader2, Lock, Mail, User } from 'lucide-react';
import OAuthButton from '@/components/auth/OAuthButton';
import { useOAuth } from '@/hooks/auth/use-oauth';
import { registerSchema, RegisterFormData } from '@/lib/validation/auth-schemas';
import { AuthInput } from '@/components/auth/AuthInput';

export default function RegisterPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const setAuth = useAuthStore((state) => state.setAuth);
  const router = useRouter();
  const { loginWithGoogle, loginWithMicrosoft, isLoading: oauthLoading } = useOAuth();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterFormData) => {
    try {
      setIsLoading(true);
      setError('');

      const response = await api.post(API_ENDPOINTS.AUTH.REGISTER, {
        name: data.name,
        email: data.email,
        password: data.password,
      });

      if (response.data.access_token) {
        setAuth(response.data.access_token, response.data.user);
        router.push(ROUTES.DASHBOARD.HOME);
      } else if (response.status === 201) {
        // Auto-login if backend doesn't return token
        const loginRes = await api.post(API_ENDPOINTS.AUTH.LOGIN, {
          email: data.email,
          password: data.password,
        });
        
        if (loginRes.data.access_token) {
          setAuth(loginRes.data.access_token, loginRes.data.user);
          router.push(ROUTES.DASHBOARD.HOME);
        } else {
             // Fallback: redirect to login
             router.push(ROUTES.AUTH.LOGIN + '?registered=true');
        }
      }
    } catch (err: any) {
      const message = err.response?.data?.message;
      setError(typeof message === 'string' ? message : 'Erro ao criar conta');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 px-4">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-2xl shadow-xl">
        {/* Header */}
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900">
            Criar Conta
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Comece sua jornada de aprendizado
          </p>
        </div>

        {/* OAuth Buttons */}
        <div className="space-y-3">
          <OAuthButton
            provider="google"
            onClick={loginWithGoogle}
            disabled={oauthLoading || isLoading}
          />
          <OAuthButton
            provider="microsoft"
            onClick={loginWithMicrosoft}
            disabled={oauthLoading || isLoading}
          />
        </div>

        {/* Divider */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">Ou cadastre-se com email</span>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <AuthInput
            id="name"
            label="Nome Completo"
            type="text"
            placeholder="João Silva"
            icon={User}
            error={errors.name?.message}
            register={register}
          />

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

          <AuthInput
            id="confirmPassword"
            label="Confirmar Senha"
            type="password"
            placeholder="••••••••"
            icon={Lock}
            error={errors.confirmPassword?.message}
            register={register}
          />

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex justify-center items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? (
              <>
                <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
                Criando conta...
              </>
            ) : (
              'Criar Conta'
            )}
          </button>
        </form>

        {/* Login Link */}
        <p className="text-center text-sm text-gray-600">
          Já tem uma conta?{' '}
          <Link href={ROUTES.AUTH.LOGIN} className="font-medium text-blue-600 hover:text-blue-500">
            Fazer login
          </Link>
        </p>
      </div>
    </div>
  );
}
