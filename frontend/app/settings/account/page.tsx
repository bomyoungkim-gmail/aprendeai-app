'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Toast, useToast } from '@/components/ui/Toast';
import { User, Mail, GraduationCap, MapPin, Calendar, Users2 } from 'lucide-react';
import api from '@/lib/api';
import { SettingsPageHeader } from '@/components/ui/SettingsPageHeader';

interface UserProfile {
  id: string;
  name: string;
  email: string;
  schoolingLevel?: string;
  address?: string;
  sex?: string;
  birthday?: string;
  age?: number;
  bio?: string;
}

const EDUCATION_LEVELS = [
  { value: 'FUNDAMENTAL', label: 'Ensino Fundamental' },
  { value: 'MEDIO', label: 'Ensino Médio' },
  { value: 'SUPERIOR', label: 'Ensino Superior' },
  { value: 'POS_GRADUACAO', label: 'Pós-Graduação' },
];

const GENDER_OPTIONS = [
  { value: 'MALE', label: 'Masculino' },
  { value: 'FEMALE', label: 'Feminino' },
  { value: 'OTHER', label: 'Outro' },
  { value: 'PREFER_NOT_TO_SAY', label: 'Prefiro não informar' },
];

export default function AccountSettingsPage() {
  const [formData, setFormData] = useState<Partial<UserProfile>>({});
  const [isEditing, setIsEditing] = useState(false);
  const { toast, show: showToast, hide: hideToast } = useToast();
  const queryClient = useQueryClient();

  const { data: user, isLoading } = useQuery({
    queryKey: ['current-user'],
    queryFn: async () => {
      const response = await api.get('/users/me');
      return response.data as UserProfile;
    },
  });

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name,
        schoolingLevel: user.schoolingLevel,
        address: user.address || '',
        sex: user.sex,
        birthday: user.birthday ? user.birthday.split('T')[0] : '',
        bio: user.bio || '',
      });
    }
  }, [user]);

  const updateProfile = useMutation({
    mutationFn: async (data: Partial<UserProfile>) => {
      const response = await api.put('/users/me', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['current-user'] });
      showToast('success', 'Perfil atualizado com sucesso!');
      setIsEditing(false);
    },
    onError: (error: any) => {
      const errorMessage = error?.response?.data?.message || error?.message || 'Erro ao atualizar perfil';
      showToast('error', errorMessage);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile.mutate(formData);
  };

  const handleChange = (field: keyof UserProfile, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleCancel = () => {
    // Reset form to original user data
    if (user) {
      setFormData({
        name: user.name,
        schoolingLevel: user.schoolingLevel,
        address: user.address || '',
        sex: user.sex,
        birthday: user.birthday ? user.birthday.split('T')[0] : '',
        bio: user.bio || '',
      });
    }
    setIsEditing(false);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 bg-gray-200 dark:bg-gray-700 rounded" />
          <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <SettingsPageHeader
        title="Conta"
        description="Gerencie suas informações pessoais"
        icon={User}
      />

      {/* Personal Information Form */}
      <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Informações Pessoais</h2>
          
          {!isEditing ? (
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="px-4 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 border border-blue-600 dark:border-blue-400 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
            >
              Editar
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleCancel}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={updateProfile.isPending}
                className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {updateProfile.isPending ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          )}
        </div>
        
        <div className="space-y-5">
          {/* Name */}
          <div>
            <label htmlFor="name" className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <User className="w-4 h-4" />
              Nome Completo
            </label>
            <input
              type="text"
              id="name"
              value={formData.name || ''}
              onChange={(e) => handleChange('name', e.target.value)}
              disabled={!isEditing}
              className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors disabled:opacity-60 disabled:cursor-not-allowed disabled:bg-gray-50 dark:disabled:bg-gray-800"
              placeholder="Seu nome completo"
              required
            />
          </div>

          {/* Email (Read-only) */}
          <div>
            <label htmlFor="email" className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <Mail className="w-4 h-4" />
              Email
            </label>
            <input
              type="email"
              id="email"
              value={user?.email || ''}
              className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-gray-500 dark:text-gray-400 rounded-lg cursor-not-allowed"
              disabled
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Entre em contato com o suporte para alterar seu email
            </p>
          </div>

          {/* Education Level */}
          <div>
            <label htmlFor="schoolingLevel" className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <GraduationCap className="w-4 h-4" />
              Escolaridade
            </label>
            <select
              id="schoolingLevel"
              value={formData.schoolingLevel || ''}
              onChange={(e) => handleChange('schoolingLevel', e.target.value)}
              disabled={!isEditing}
              className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors disabled:opacity-60 disabled:cursor-not-allowed disabled:bg-gray-50 dark:disabled:bg-gray-800"
            >
              <option value="">Selecione sua escolaridade</option>
              {EDUCATION_LEVELS.map(level => (
                <option key={level.value} value={level.value}>{level.label}</option>
              ))}
            </select>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Usado para personalizar o nível de vocabulário
            </p>
          </div>

          {/* Address */}
          <div>
            <label htmlFor="address" className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <MapPin className="w-4 h-4" />
              Endereço
            </label>
            <input
              type="text"
              id="address"
              value={formData.address || ''}
              onChange={(e) => handleChange('address', e.target.value)}
              disabled={!isEditing}
              className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors disabled:opacity-60 disabled:cursor-not-allowed disabled:bg-gray-50 dark:disabled:bg-gray-800"
              placeholder="Rua, Número - Cidade, Estado"
            />
          </div>

          {/* Gender */}
          <div>
            <label htmlFor="sex" className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <Users2 className="w-4 h-4" />
              Sexo
            </label>
            <select
              id="sex"
              value={formData.sex || ''}
              onChange={(e) => handleChange('sex', e.target.value)}
              disabled={!isEditing}
              className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors disabled:opacity-60 disabled:cursor-not-allowed disabled:bg-gray-50 dark:disabled:bg-gray-800"
            >
              <option value="">Selecione</option>
              {GENDER_OPTIONS.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>

          {/* Birthday */}
          <div>
            <label htmlFor="birthday" className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <Calendar className="w-4 h-4" />
              Data de Nascimento
            </label>
            <input
              type="date"
              id="birthday"
              value={formData.birthday || ''}
              onChange={(e) => handleChange('birthday', e.target.value)}
              disabled={!isEditing}
              className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors disabled:opacity-60 disabled:cursor-not-allowed disabled:bg-gray-50 dark:disabled:bg-gray-800"
            />
          </div>
        </div>
      </form>

      {/* Toast */}
      {toast && (
        <Toast type={toast.type} message={toast.message} onClose={hideToast} />
      )}
    </div>
  );
}
