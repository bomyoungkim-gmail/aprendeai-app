'use client';

import { useUserSettings, useUpdateSettings } from '@/hooks/use-user-profile';
import { Toast, useToast } from '@/components/ui/Toast';

export default function NotificationsPage() {
  const { data: settings, isLoading } = useUserSettings();
  const updateSettings = useUpdateSettings();
  const { toast, show: showToast, hide: hideToast } = useToast();

  const handleToggle = async (key: keyof typeof settings.notifications) => {
    if (!settings) return;

    const newValue = !settings.notifications[key];
    
    try {
      await updateSettings.mutateAsync({
        notifications: {
          ...settings.notifications,
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
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="animate-pulse space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center justify-between py-3">
              <div className="h-5 w-48 bg-gray-200 rounded" />
              <div className="h-6 w-12 bg-gray-200 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <p className="text-gray-600">Failed to load notification settings</p>
      </div>
    );
  }

  const notifications = [
    { key: 'email' as const, label: 'Email Notifications', description: 'Receive email notifications' },
    { key: 'groupInvites' as const, label: 'Group Invitations', description: 'Get notified when invited to groups' },
    { key: 'annotations' as const, label: 'Annotation Notifications', description: 'Get notified of new annotations on your content' },
    { key: 'sessionReminders' as const, label: 'Session Reminders', description: 'Get reminded about upcoming study sessions' },
    { key: 'weeklyDigest' as const, label: 'Weekly Digest', description: 'Receive a weekly summary of your activity' },
  ];

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">Notification Preferences</h2>
      
      <div className="space-y-4">
        {notifications.map((notif) => (
          <div key={notif.key} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
            <div className="flex-1">
              <h3 className="text-sm font-medium text-gray-900">{notif.label}</h3>
              <p className="text-sm text-gray-600">{notif.description}</p>
            </div>
            <button
              onClick={() => handleToggle(notif.key)}
              disabled={updateSettings.isPending}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 ${
                settings.notifications[notif.key] ? 'bg-blue-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings.notifications[notif.key] ? 'translate-x-6' : 'translate-x-1'
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
