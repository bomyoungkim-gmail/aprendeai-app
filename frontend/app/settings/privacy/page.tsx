'use client';

import { useUserSettings, useUpdateSettings } from '@/hooks/use-user-profile';
import { Toast, useToast } from '@/components/ui/Toast';
import { Download } from 'lucide-react';

export default function PrivacyPage() {
  const { data: settings, isLoading } = useUserSettings();
  const updateSettings = useUpdateSettings();
  const { toast, show: showToast, hide: hideToast } = useToast();

  const handleToggle = async (key: string) => {
    if (!settings) return;

    const currentPrivacy = settings.privacy || {};
    const newValue = !currentPrivacy[key];
    
    try {
      await updateSettings.mutateAsync({
        privacy: {
          ...currentPrivacy,
          [key]: newValue,
        },
      });
      showToast('success', 'Privacy settings updated');
    } catch (error) {
      showToast('error', 'Failed to update settings');
    }
  };

  const handleExportData = async () => {
    try {
      showToast('info', 'Data export will be sent to your email');
      // TODO: Implement actual export
    } catch (error) {
      showToast('error', 'Failed to request data export');
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="animate-pulse space-y-4">
          {[...Array(3)].map((_, i) => (
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
        <p className="text-gray-600">Failed to load privacy settings</p>
      </div>
    );
  }

  const privacy = settings.privacy || {};

  const privacySettings = [
    { key: 'profileVisible', label: 'Public Profile', description: 'Make your profile visible to other users' },
    { key: 'showStats', label: 'Show Statistics', description: 'Display your study statistics on your profile' },
    { key: 'allowEmailDiscovery', label: 'Email Discovery', description: 'Allow others to find you by email address' },
  ];

  return (
    <div className="space-y-6">
      {/* Privacy Settings */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Privacy Settings</h2>
        
        <div className="space-y-4">
          {privacySettings.map((setting) => (
            <div key={setting.key} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
              <div className="flex-1">
                <h3 className="text-sm font-medium text-gray-900">{setting.label}</h3>
                <p className="text-sm text-gray-600">{setting.description}</p>
              </div>
              <button
                onClick={() => handleToggle(setting.key)}
                disabled={updateSettings.isPending}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 ${
                  privacy[setting.key] ? 'bg-blue-600' : 'bg-gray-200'
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

      {/* Data Export */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Data Export</h2>
        <p className="text-sm text-gray-600 mb-4">
          Download all your data in a machine-readable format (GDPR compliance)
        </p>
        <button
          onClick={handleExportData}
          className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Download className="w-4 h-4" />
          Request Data Export
        </button>
      </div>

      {/* Toast */}
      {toast && (
        <Toast type={toast.type} message={toast.message} onClose={hideToast} />
      )}
    </div>
  );
}
