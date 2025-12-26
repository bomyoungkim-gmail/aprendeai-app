'use client';

import { UserSettings, useUserSettings, useUpdateSettings } from '@/hooks/profile/use-user-profile';
import { Toast, useToast } from '@/components/ui/Toast';

export default function NotificationsPage() {
  const { data: settings, isLoading } = useUserSettings();
  const updateSettings = useUpdateSettings();
  const { toast, show: showToast, hide: hideToast } = useToast();

  // Default settings as fallback
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
  const notificationsData = currentSettings.notifications || defaultSettings.notifications;

  const handleToggle = async (key: keyof UserSettings['notifications']) => {
    // We need actual settings to perform an update, not just default fallback
    if (!settings) {
      showToast('error', 'Configurações ainda não carregadas. Tente novamente.');
      return;
    }

    const currentNotifications = settings.notifications || {}; // Use actual settings for the current state
    const newValue = !currentNotifications[key];
    
    try {
      await updateSettings.mutateAsync({
        notifications: {
          ...(settings.notifications || {}),
          [key]: newValue,
        },
      });
      showToast('success', 'Notification settings updated');
    } catch (error) {
      showToast('error', 'Failed to update settings');
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="animate-pulse space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center justify-between py-3">
              <div className="h-5 w-48 bg-gray-200 dark:bg-gray-700 rounded" />
              <div className="h-6 w-12 bg-gray-200 dark:bg-gray-700 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const notificationsList = [
    { key: 'email' as const, label: 'Notificações por Email', description: 'Receber notificações por email' },
    { key: 'groupInvites' as const, label: 'Convites de Grupo', description: 'Ser notificado ao ser convidado para grupos' },
    { key: 'annotations' as const, label: 'Notificações de Anotações', description: 'Ser notificado de novas anotações no seu conteúdo' },
    { key: 'sessionReminders' as const, label: 'Lembretes de Sessão', description: 'Receber lembretes sobre sessões de estudo futuras' },
    { key: 'weeklyDigest' as const, label: 'Resumo Semanal', description: 'Receber um resumo semanal das suas atividades' },
  ];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Preferências de Notificação</h2>
      
      <div className="space-y-4">
        {notificationsList.map((notif) => (
          <div key={notif.key} className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-gray-700 last:border-0">
            <div className="flex-1">
              <h3 className="text-sm font-medium text-gray-900 dark:text-white">{notif.label}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">{notif.description}</p>
            </div>
            <button
              onClick={() => handleToggle(notif.key)}
              disabled={updateSettings.isPending}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 ${
                notificationsData?.[notif.key] ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  notificationsData?.[notif.key] ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        ))}
      </div>

      {/* Toast */}
      {toast && (
        <Toast type={toast.type} message={toast.message} onClose={hideToast} />
      )}
    </div>
  );
}
