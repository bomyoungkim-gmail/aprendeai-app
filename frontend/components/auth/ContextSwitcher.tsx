'use client';

import { useAuthStore } from '@/stores/auth-store';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Building2, Loader2 } from 'lucide-react';
import { ROUTES } from '@/lib/config/routes';

export function ContextSwitcher() {
  const user = useAuthStore((state) => state.user);
  const switchContext = useAuthStore((state) => state.switchContext);
  const router = useRouter();
  
  const activeInstitutionId = user?.activeInstitutionId;
  const memberships = user?.institutionMemberships || [];
  const [loading, setLoading] = useState(false);

  // If user has no memberships, do not render switcher
  if (!memberships.length) return null;

  const handleSwitch = async (institutionId: string) => {
    if (institutionId === activeInstitutionId) return;
    setLoading(true);
    try {
        const success = await switchContext(institutionId);
        if (success) {
            // Check new role to decide redirect
            // Ideally auth-store updates 'user' immediately.
            // We force a router refresh or redirect to dashboard to ensure proper page load
            router.push('/institution/dashboard'); 
            router.refresh(); 
        }
    } catch (e) {
        console.error('Failed to switch context', e);
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="w-full">
        <label className="text-xs font-semibold text-gray-500 mb-1.5 flex items-center gap-1.5 px-1">
            <Building2 className="w-3.5 h-3.5" />
            Instituição
        </label>
        
        <div className="relative">
            <select 
                className="w-full text-sm bg-white border border-gray-200 text-gray-900 rounded-md p-2 appearance-none focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:opacity-50"
                value={activeInstitutionId || ''}
                onChange={(e) => handleSwitch(e.target.value)}
                disabled={loading}
            >
                {!activeInstitutionId && <option value="" disabled>Selecione...</option>}
                {memberships.map((m) => (
                    <option key={m.institution.id} value={m.institution.id}>
                        {m.institution.name}
                    </option>
                ))}
            </select>
            
            {loading && (
                <div className="absolute right-2 top-2.5">
                    <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                </div>
            )}
        </div>
        
        {/* Helper text for current role */ }
        {activeInstitutionId && (
            <div className="text-xs text-gray-400 mt-1 px-1">
                Atuando como: <span className="font-medium text-gray-600">{user?.contextRole || user?.role}</span>
            </div>
        )}
    </div>
  );
}
