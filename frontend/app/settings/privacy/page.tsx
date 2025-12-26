'use client';

import { useState } from 'react';
import { UserSettings, useUserSettings, useUpdateSettings , useChangePassword, useDeleteAccount } from '@/hooks/profile/use-user-profile';

import { Toast, useToast } from '@/components/ui/Toast';
import { Download, Lock, AlertTriangle, Shield } from 'lucide-react';
import { SettingsPageHeader } from '@/components/ui/SettingsPageHeader';

export default function PrivacyPage() {
  // State for password change
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // State for account deletion
  const [deletePassword, setDeletePassword] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const { data: settings, isLoading } = useUserSettings();
  const updateSettings = useUpdateSettings();
  const changePassword = useChangePassword();
  const deleteAccount = useDeleteAccount();
  const { toast, show: showToast, hide: hideToast } = useToast();

  // Use default settings if API fails or returns null
  const defaultSettings: UserSettings = {
    notifications: {
      email: true,
      groupInvites: true,
      annotations: true,
      sessionReminders: true,
      weeklyDigest: false,
    },
    privacy: {
      profileVisible: true,
      showStats: true,
      allowEmailDiscovery: true,
    },
  };

  const currentSettings = settings || defaultSettings;
  const privacy = currentSettings.privacy || defaultSettings.privacy;

  const handleToggle = async (key: keyof UserSettings['privacy']) => {
    const currentPrivacy = currentSettings?.privacy || {};
    const newValue = !currentPrivacy[key];
    
    try {
      await updateSettings.mutateAsync({
        privacy: {
          ...currentPrivacy,
          [key]: newValue,
        },
      });
      showToast('success', 'Configuração de  privacidade atualizada');
    } catch (error) {
      showToast('error', 'Erro ao atualizar configuração');
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      showToast('error', 'As senhas não coincidem');
      return;
    }

    if (newPassword.length < 6) {
      showToast('error', 'A senha deve ter pelo menos 6 caracteres');
      return;
    }

    try {
      await changePassword.mutateAsync({ currentPassword, newPassword });
      showToast('success', 'Senha alterada com sucesso!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      showToast('error', error.response?.data?.message || 'Erro ao alterar senha');
    }
  };

  const handleDeleteAccount = async () => {
    if (!deletePassword) {
      showToast('error', 'Por favor, insira sua senha');
      return;
    }

    try {
      await deleteAccount.mutateAsync(deletePassword);
      showToast('success', 'Conta excluída com sucesso');
      window.location.href = '/login';
    } catch (error: any) {
      showToast('error', error.response?.data?.message || 'Erro ao excluir conta');
    }
  };

  const handleExportData = async () => {
    try {
      showToast('info', 'Exportação de dados será enviada para seu email');
      // TODO: Implement actual export
    } catch (error) {
      showToast('error', 'Erro ao solicitar exportação de dados');
    }
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

  const privacySettings = [
    { key: 'profileVisible' as const, label: 'Perfil Público', description: 'Tornar seu perfil visível para outros usuários' },
    { key: 'showStats' as const, label: 'Exibir Estatísticas', description: 'Mostrar suas estatísticas de estudo no perfil' },
    { key: 'allowEmailDiscovery' as const, label: 'Descoberta por Email', description: 'Permitir que outros encontrem você pelo email' },
  ];

  return (
    <div className="space-y-6">
      <SettingsPageHeader
        title="Privacidade & Segurança"
        description="Gerencie privacidade, senha e segurança da conta"
        icon={Shield}
      />

      {/* Privacy Settings */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Configurações de Privacidade</h2>
        
        <div className="space-y-4">
          {privacySettings.map((setting) => (
            <div key={setting.key} className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-gray-700 last:border-0">
              <div className="flex-1">
                <h3 className="text-sm font-medium text-gray-900 dark:text-white">{setting.label}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">{setting.description}</p>
              </div>
              <button
                onClick={() => handleToggle(setting.key)}
                disabled={updateSettings.isPending}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 ${
                  privacy[setting.key] ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    privacy[setting.key] ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Change Password Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Lock className="w-5 h-5 text-gray-700 dark:text-gray-300" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Alterar Senha</h2>
        </div>
        
        <form onSubmit={handleChangePassword} className="space-y-4">
          <div>
            <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Senha Atual
            </label>
            <input
              type="password"
              id="currentPassword"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Nova Senha
            </label>
            <input
              type="password"
              id="newPassword"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Confirmar Nova Senha
            </label>
            <input
              type="password"
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <button
            type="submit"
            disabled={changePassword.isPending}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {changePassword.isPending ? 'Alterando...' : 'Alterar Senha'}
          </button>
        </form>
      </div>

      {/* Data Export */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Exportação de Dados</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Baixe todos os seus dados em formato legível (conformidade GDPR)
        </p>
        <button
          onClick={handleExportData}
          className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Download className="w-4 h-4" />
          Solicitar Exportação de Dados
        </button>
      </div>

      {/* Danger Zone */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-red-200 dark:border-red-900/50 p-6">
        <div className="flex items-start gap-3 mb-4">
          <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <h2 className="text-xl font-semibold text-red-900 dark:text-red-400 mb-1">Zona de Perigo</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Uma vez que você excluir sua conta, não há como voltar atrás. Por favor, tenha certeza.
            </p>
          </div>
        </div>

        {!showDeleteConfirm ? (
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="px-6 py-2 bg-red-600 dark:bg-red-700 text-white rounded-lg hover:bg-red-700 dark:hover:bg-red-600 transition-colors"
          >
            Excluir Conta
          </button>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-gray-700 dark:text-gray-300 font-medium">
              Digite sua senha para confirmar a exclusão da conta:
            </p>
            <input
              type="password"
              value={deletePassword}
              onChange={(e) => setDeletePassword(e.target.value)}
              placeholder="Sua senha"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
            />
            <div className="flex gap-3">
              <button
                onClick={handleDeleteAccount}
                disabled={deleteAccount.isPending}
                className="px-6 py-2 bg-red-600 dark:bg-red-700 text-white rounded-lg hover:bg-red-700 dark:hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {deleteAccount.isPending ? 'Excluindo...' : 'Confirmar Exclusão'}
              </button>
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setDeletePassword('');
                }}
                className="px-6 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Toast */}
      {toast && (
        <Toast type={toast.type} message={toast.message} onClose={hideToast} />
      )}
    </div>
  );
}
