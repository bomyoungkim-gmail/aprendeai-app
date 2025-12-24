'use client';

import { useEffect, useState } from 'react';
import { API_BASE_URL, API_ENDPOINTS } from '@/lib/config/api';

interface SSOConfig {
  id?: string;
  provider: 'SAML' | 'OIDC' | 'GOOGLE' | 'MICROSOFT';
  issuer: string;
  entryPoint: string;
  cert?: string;
  clientId?: string;
  clientSecret?: string;
  isEnabled: boolean;
}

interface InstitutionData {
  id: string;
  name: string;
}

export default function SSOPage() {
  const [institution, setInstitution] = useState<InstitutionData | null>(null);
  const [ssoConfig, setSSOConfig] = useState<SSOConfig | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const getToken = () => localStorage.getItem('token');

  const fetchData = async () => {
    try {
      const instRes = await fetch(`${API_BASE_URL}${API_ENDPOINTS.INSTITUTIONS.MY_INSTITUTION}`, {
        headers: { 'Authorization': `Bearer ${getToken()}` },
      });
      if (instRes.ok) {
        const instData = await instRes.json();
        setInstitution(instData);

        // Fetch SSO config
        const ssoRes = await fetch(`${API_BASE_URL}${API_ENDPOINTS.INSTITUTIONS.SSO_GET(instData.id)}`, {
          headers: { 'Authorization': `Bearer ${getToken()}` },
        });
        if (ssoRes.ok) {
          setSSOConfig(await ssoRes.json());
        }
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSSO = async (config: SSOConfig) => {
    if (!institution) return;

    try {
      const endpoint = ssoConfig?.id 
        ? API_ENDPOINTS.INSTITUTIONS.SSO_UPDATE(institution.id)
        : API_ENDPOINTS.INSTITUTIONS.SSO_CREATE(institution.id);
        
      const method = ssoConfig?.id ? 'PATCH' : 'POST';

      const res = await fetch(`${API_BASE_URL}${endpoint}`, {
        method,
        headers: {
          'Authorization': `Bearer ${getToken()}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(config),
      });

      if (res.ok) {
        setSSOConfig(await res.json());
        alert('SSO Configuration saved!');
      } else {
        const error = await res.json();
        alert(`Failed: ${error.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Failed to save SSO config:', error);
      alert('Failed to save SSO configuration');
    }
  };

  const handleTestSSO = async () => {
    if (!institution) return;

    try {
      const res = await fetch(`${API_BASE_URL}${API_ENDPOINTS.INSTITUTIONS.SSO_TEST(institution.id)}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${getToken()}`,
          'Content-Type': 'application/json',
        },
      });
      const data = await res.json();
      alert(`Test Result: ${data.status} - ${data.message}`);
    } catch (error) {
      console.error('SSO Test failed:', error);
      alert('SSO Test failed to execute');
    }
  };

  if (loading) {
    return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div></div>;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">SSO Configuration</h1>
      <SSOTab
        config={ssoConfig}
        onSave={handleSaveSSO}
        onTest={handleTestSSO}
      />
    </div>
  );
}

// Reusing SSO Tab component from admin page
function SSOTab({ config, onSave, onTest }: any) {
  const [formData, setFormData] = useState<SSOConfig>({
    provider: 'SAML',
    issuer: '',
    entryPoint: '',
    cert: '',
    isEnabled: false,
    ...config,
  });

  const handleChange = (e: any) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  return (
    <div className="bg-white shadow rounded-lg p-6 max-w-4xl">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-medium text-gray-900">Single Sign-On (SSO) Configuration</h2>
        <div className="flex items-center">
          <label className="flex items-center cursor-pointer">
            <div className="relative">
              <input
                type="checkbox"
                name="isEnabled"
                className="sr-only"
                checked={formData.isEnabled}
                onChange={handleChange}
              />
              <div className={`block w-14 h-8 rounded-full ${formData.isEnabled ? 'bg-indigo-600' : 'bg-gray-400'}`}></div>
              <div className={`dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition ${formData.isEnabled ? 'transform translate-x-6' : ''}`}></div>
            </div>
            <div className="ml-3 text-gray-700 font-medium">
              {formData.isEnabled ? 'Enabled' : 'Disabled'}
            </div>
          </label>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
        <div className="sm:col-span-3">
          <label className="block text-sm font-medium text-gray-700">Provider Type</label>
          <select
            name="provider"
            value={formData.provider}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border"
          >
            <option value="SAML">SAML 2.0</option>
            <option value="OIDC">OpenID Connect (OIDC)</option>
            <option value="GOOGLE">Google Workspace</option>
            <option value="MICROSOFT">Microsoft Entra ID (Azure AD)</option>
          </select>
        </div>

        <div className="sm:col-span-6 border-t border-gray-200 pt-6">
          {formData.provider === 'SAML' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                <div className="sm:col-span-3">
                  <label className="block text-sm font-medium text-gray-700">Entity ID (Issuer)</label>
                  <input
                    type="text"
                    name="issuer"
                    value={formData.issuer}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border"
                    placeholder="https://idp.example.com/metadata"
                  />
                </div>

                <div className="sm:col-span-3">
                  <label className="block text-sm font-medium text-gray-700">SSO Entry Point</label>
                  <input
                    type="text"
                    name="entryPoint"
                    value={formData.entryPoint}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border"
                    placeholder="https://idp.example.com/sso"
                  />
                </div>

                <div className="sm:col-span-6">
                  <label className="block text-sm font-medium text-gray-700">X.509 Certificate</label>
                  <textarea
                    name="cert"
                    rows={5}
                    value={formData.cert}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border font-mono"
                    placeholder="-----BEGIN CERTIFICATE-----"
                  />
                </div>
              </div>
            </div>
          )}

          {(formData.provider === 'OIDC' || formData.provider === 'GOOGLE' || formData.provider === 'MICROSOFT') && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                <div className="sm:col-span-3">
                  <label className="block text-sm font-medium text-gray-700">Client ID</label>
                  <input
                    type="text"
                    name="clientId"
                    value={formData.clientId || ''}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border"
                  />
                </div>

                <div className="sm:col-span-3">
                  <label className="block text-sm font-medium text-gray-700">Client Secret</label>
                  <input
                    type="password"
                    name="clientSecret"
                    value={formData.clientSecret || ''}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border"
                  />
                </div>

                <div className="sm:col-span-6">
                  <label className="block text-sm font-medium text-gray-700">Issuer URL</label>
                  <input
                    type="text"
                    name="issuer"
                    value={formData.issuer}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border"
                    placeholder="https://accounts.google.com"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="mt-8 flex justify-end gap-3 pt-5 border-t border-gray-200">
        <button
          type="button"
          onClick={onTest}
          disabled={!formData.isEnabled}
          className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:opacity-50"
        >
          Test Connection
        </button>
        <button
          type="button"
          onClick={() => onSave(formData)}
          className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
        >
          Save Configuration
        </button>
      </div>
    </div>
  );
}
