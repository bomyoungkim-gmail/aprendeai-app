'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter, useSearchParams } from 'next/navigation';
import { API_BASE_URL, API_ENDPOINTS } from '@/lib/config/api';
import { ROUTES } from '@/lib/config/routes';
import { useAuthStore } from '@/stores/auth-store';
import { Loader2, Lock, User, Building2, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { registerSchema, RegisterFormData } from '@/lib/validation/auth-schemas';
import { AuthInput } from '@/components/auth/AuthInput';

interface InviteValidation {
  valid: boolean;
  message?: string;
  institutionId?: string;
  institutionName?: string;
  email?: string;
  role?: string;
  expiresAt?: string;
}

export default function RegisterWithInvitePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const inviteToken = searchParams.get('token');
  const setAuth = useAuthStore((state) => state.setAuth);

  const [validating, setValidating] = useState(true);
  const [inviteData, setInviteData] = useState<InviteValidation | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  // Validate invite token on mount
  useEffect(() => {
    if (!inviteToken) {
      setValidating(false);
      setInviteData({ valid: false, message: 'Token de convite não fornecido' });
      return;
    }

    validateInvite();
  }, [inviteToken]);

  const validateInvite = async () => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/institutions/validate-invite?token=${inviteToken}`
      );

      if (response.ok) {
        const data = await response.json();
        setInviteData(data);
      } else {
        const error = await response.json();
        setInviteData({ 
          valid: false, 
          message: error.message || 'Token inválido ou expirado' 
        });
      }
    } catch (err) {
      setInviteData({ 
        valid: false, 
        message: 'Erro ao validar convite' 
      });
    } finally {
      setValidating(false);
    }
  };

  const onSubmit = async (data: RegisterFormData) => {
    if (!inviteData?.valid || !inviteToken) return;

    try {
      setIsLoading(true);
      setError('');

      const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.AUTH.REGISTER}?inviteToken=${inviteToken}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: data.name,
          email: inviteData.email,
          password: data.password,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        
        if (result.access_token) {
          setSuccess(true);
          setTimeout(() => {
            setAuth(result.access_token, result.user);
            router.push(ROUTES.DASHBOARD.HOME);
          }, 2000);
        }
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Erro ao criar conta');
      }
    } catch (err: any) {
      setError('Erro ao processar registro');
    } finally {
      setIsLoading(false);
    }
  };

  // Loading state
  if (validating) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-green-600 mx-auto mb-4" />
          <p className="text-gray-600">Validando convite...</p>
        </div>
      </div>
    );
  }

  // Invalid invite
  if (!inviteData?.valid) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-50 px-4">
        <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-xl text-center">
          <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Convite Inválido</h2>
          <p className="text-gray-600 mb-6">
            {inviteData?.message || 'Este convite não é válido ou já expirou.'}
          </p>
          <Link
            href="/register"
            className="inline-block px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition"
          >
            Cadastrar sem convite
          </Link>
        </div>
      </div>
    );
  }

  // Success state
  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50 px-4">
        <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-xl text-center">
          <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Conta criada com sucesso!</h2>
          <p className="text-gray-600 mb-4">
            Bem-vindo(a) ao <strong>{inviteData.institutionName}</strong>!
          </p>
          <p className="text-sm text-gray-500">Redirecionando para o dashboard...</p>
        </div>
      </div>
    );
  }

  // Registration form
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50 px-4 py-12">
      <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-xl">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
            <Building2 className="h-8 w-8 text-green-600" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900">
            Convite Institucional
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Complete seu cadastro para acessar
          </p>
        </div>

        {/* Institution Info Card */}
        <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">
                Você foi convidado para:
              </p>
              <p className="text-lg font-bold text-green-700 mt-1">
                {inviteData.institutionName}
              </p>
              <div className="mt-2 space-y-1 text-sm text-gray-600">
                <p><strong>Email:</strong> {inviteData.email}</p>
                <p><strong>Função:</strong> {inviteData.role}</p>
                {inviteData.expiresAt && (
                  <p><strong>Expira em:</strong> {new Date(inviteData.expiresAt).toLocaleDateString('pt-BR')}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <AuthInput
            id="name"
            label="Nome Completo"
            type="text"
            placeholder="Seu nome completo"
            icon={User}
            error={errors.name?.message}
            register={register}
          />

          {/* Email (read-only) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <input
              type="email"
              value={inviteData.email}
              disabled
              className="block w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-gray-600 cursor-not-allowed"
            />
            <p className="mt-1 text-xs text-gray-500">
              O email é pré-definido pelo convite
            </p>
          </div>

          <AuthInput
            id="password"
            label="Senha"
            type="password"
            placeholder="Mínimo 6 caracteres"
            icon={Lock}
            error={errors.password?.message}
            register={register}
          />

          <AuthInput
            id="confirmPassword"
            label="Confirmar Senha"
            type="password"
            placeholder="Digite a senha novamente"
            icon={Lock}
            error={errors.confirmPassword?.message}
            register={register}
          />

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex items-center justify-center px-4 py-3 border border-transparent text-sm font-medium rounded-lg text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {isLoading ? (
              <>
                <Loader2 className="animate-spin -ml-1 mr-2 h-5 w-5" />
                Criando conta...
              </>
            ) : (
              'Criar Conta e Aceitar Convite'
            )}
          </button>
        </form>

        {/* Footer */}
        <p className="mt-6 text-center text-sm text-gray-600">
          Já tem uma conta?{' '}
          <Link href="/login" className="font-medium text-green-600 hover:text-green-500">
            Fazer login
          </Link>
        </p>
      </div>
    </div>
  );
}
