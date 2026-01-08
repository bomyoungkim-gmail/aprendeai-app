/**
 * Policy-Aware Feature Wrappers
 * 
 * Generic wrappers for features that need policy gate checking.
 * Provides consistent UX for disabled features.
 */

'use client';

import { usePolicy } from '@/hooks/use-policy';
import type { DecisionPolicyV1 } from '@/types/session';
import { Info, Shield } from 'lucide-react';
import { ReactNode } from 'react';

interface PolicyAwareFeatureProps {
  children: ReactNode;
  featureGate: 'transfer' | 'pkm' | 'games' | 'sentenceAnalysis' | 'missionFeedback' | 'hugging';
  featureName: string;
  policy?: DecisionPolicyV1;
  userRole?: 'LEARNER' | 'EDUCATOR' | 'ADMIN' | 'PARENT';
  fallbackMessage?: string;
}

/**
 * Generic wrapper for policy-aware features
 * 
 * @example
 * ```tsx
 * <PolicyAwareFeature
 *   featureGate="pkm"
 *   featureName="Atomic Notes"
 *   policy={session?.decision_policy}
 *   userRole={user?.role}
 * >
 *   <PkmComponent />
 * </PolicyAwareFeature>
 * ```
 */
export function PolicyAwareFeature({
  children,
  featureGate,
  featureName,
  policy,
  userRole,
  fallbackMessage,
}: PolicyAwareFeatureProps) {
  const gates = usePolicy({ policy, userRole });
  
  // Map feature gate to policy check
  const isEnabled = (() => {
    switch (featureGate) {
      case 'transfer':
        return gates.isTransferGraphEnabled;
      case 'pkm':
        return gates.isPkmEnabled;
      case 'games':
        return gates.isGamesEnabled;
      case 'sentenceAnalysis':
        return gates.isSentenceAnalysisEnabled;
      case 'missionFeedback':
        return gates.isMissionFeedbackEnabled;
      case 'hugging':
        return gates.isHuggingEnabled;
      default:
        return true;
    }
  })();
  
  // If disabled and not admin, show message
  if (!isEnabled && !gates.isAdminOverride) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[200px] p-6 text-center border border-dashed border-gray-300 rounded-lg">
        <Info className="h-8 w-8 text-muted-foreground mb-3" />
        <h4 className="text-sm font-semibold mb-1">{featureName} Desabilitado</h4>
        <p className="text-xs text-muted-foreground max-w-sm">
          {fallbackMessage || `${featureName} está desabilitado pela política institucional.`}
        </p>
      </div>
    );
  }
  
  // If admin override, wrap with indicator
  if (gates.isAdminOverride) {
    return (
      <div className="relative">
        <div className="absolute top-0 right-0 z-50 flex items-center gap-1 bg-yellow-100 text-yellow-900 px-2 py-0.5 rounded-bl-md text-[10px] font-medium">
          <Shield className="h-2.5 w-2.5" />
          Admin
        </div>
        {children}
      </div>
    );
  }
  
  // Normal flow - feature enabled
  return <>{children}</>;
}

/**
 * Simplified wrapper that just hides the feature if disabled
 */
export function PolicyGatedFeature({
  children,
  featureGate,
  policy,
  userRole,
}: Omit<PolicyAwareFeatureProps, 'featureName' | 'fallbackMessage'>) {
  const gates = usePolicy({ policy, userRole });
  
  const isEnabled = (() => {
    switch (featureGate) {
      case 'transfer':
        return gates.isTransferGraphEnabled;
      case 'pkm':
        return gates.isPkmEnabled;
      case 'games':
        return gates.isGamesEnabled;
      case 'sentenceAnalysis':
        return gates.isSentenceAnalysisEnabled;
      case 'missionFeedback':
        return gates.isMissionFeedbackEnabled;
      case 'hugging':
        return gates.isHuggingEnabled;
      default:
        return true;
    }
  })();
  
  if (!isEnabled && !gates.isAdminOverride) {
    return null; // Hide completely
  }
  
  // Show admin badge if override
  if (gates.isAdminOverride) {
    return (
      <div className="relative inline-block">
        <div className="absolute -top-1 -right-1 z-50">
          <Shield className="h-3 w-3 text-yellow-600" />
        </div>
        {children}
      </div>
    );
  }
  
  return <>{children}</>;
}
