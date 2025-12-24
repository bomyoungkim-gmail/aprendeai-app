'use client';

import { useState, Suspense } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import api from '@/lib/api';
import { API_ENDPOINTS } from '@/lib/config/api';
import { ROUTES } from '@/lib/config/routes';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, Lock, CheckCircle } from 'lucide-react';
import Link from 'next/link';

const resetPasswordSchema = z.object({
  password: z.string().min(8, 'A senha deve ter no mínimo 8 caracteres'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "As senhas não coincidem",
  path: ["confirmPassword"],
});

type ResetPasswordData = z.infer<typeof resetPasswordSchema>;

function ResetPasswordForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordData>({
    resolver: zodResolver(resetPasswordSchema),
  });

  const onSubmit = async (data: ResetPasswordData) => {
    if (!token) {
      setError('Token inválido ou ausente.');
      return;
    }

    setIsLoading(true);
    setError('');
    try {
      await api.post(API_ENDPOINTS.AUTH.RESET_PASSWORD, {
        token,
        password: data.password,
      });
      setIsSuccess(true);
      setTimeout(() => router.push(ROUTES.AUTH.LOGIN), 3000);
    } catch (err: any) {
      console.error(err);
      const msg = err.response?.data?.message;
      if (typeof msg === 'string') setError(msg);
      else if (err.message) setError(err.message);
      else setError('Erro ao redefinir senha.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!token) {
      return (
          <div className="text-center">
              <div className="text-red-500 mb-4">Token inválido ou ausente.</div>
              <Link href={ROUTES.AUTH.LOGIN} className="text-blue-600 hover:text-blue-500">
                  Voltar para o login
              </Link>
          </div>
      );
  }

  return (
    <div className="bg-white p-8 shadow rounded-lg border border-gray-100">
      {isSuccess ? (
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="rounded-full bg-green-100 p-3">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </div>
          <h3 className="text-lg font-medium text-gray-900">Senha Alterada!</h3>
          <p className="text-sm text-gray-500">
            Sua senha foi redefinida com sucesso. Redirecionando para o login...
          </p>
          <div className="mt-6">
            <Link
              href={ROUTES.AUTH.LOGIN}
              className="text-sm font-medium text-blue-600 hover:text-blue-500"
            >
              Ir para o login agora
            </Link>
          </div>
        </div>
      ) : (
        <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Nova Senha
            </label>
            <div className="relative mt-1">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <Lock className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="password"
                type="password"
                className="block w-full rounded-md border border-gray-300 py-2 pl-10 text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                placeholder="********"
                {...register('password')}
              />
            </div>
            {errors.password && (
              <p className="mt-2 text-sm text-red-600">{errors.password.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
              Confirme a Nova Senha
            </label>
            <div className="relative mt-1">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <Lock className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="confirmPassword"
                type="password"
                className="block w-full rounded-md border border-gray-300 py-2 pl-10 text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                placeholder="********"
                {...register('confirmPassword')}
              />
            </div>
            {errors.confirmPassword && (
              <p className="mt-2 text-sm text-red-600">{errors.confirmPassword.message}</p>
            )}
          </div>

          {error && <div className="text-sm text-red-600 text-center">{error}</div>}

          <button
            type="submit"
            disabled={isLoading}
            className="flex w-full justify-center rounded-md border border-transparent bg-blue-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Redefinindo...
              </>
            ) : (
              'Redefinir Senha'
            )}
          </button>
        </form>
      )}
    </div>
  );
}

export default function ResetPasswordPage() {
    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
            <div className="w-full max-w-md space-y-8">
                <div className="text-center">
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900">Redefinir Senha</h1>
                </div>
                <Suspense fallback={<div className="text-center">Carregando...</div>}>
                    <ResetPasswordForm />
                </Suspense>
            </div>
        </div>
    );
}
