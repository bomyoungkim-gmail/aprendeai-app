/**
 * Policy Indicator Component
 * 
 * Shows a subtle indicator when features are disabled by institutional policy.
 * Provides transparency to users about why certain features are unavailable.
 * Shows admin override status when applicable.
 */

import { Info, Shield } from 'lucide-react';
import { usePolicy } from '@/hooks/use-policy';
import type { DecisionPolicyV1 } from '@/types/session';

interface PolicyIndicatorProps {
  policy?: DecisionPolicyV1;
  userRole?: 'LEARNER' | 'EDUCATOR' | 'ADMIN' | 'PARENT';
  className?: string;
}

/**
 * Displays a message when any features are disabled by policy
 */
export function PolicyIndicator({ policy, userRole, className }: PolicyIndicatorProps) {
  const gates = usePolicy({ policy, userRole });
  
  // Show admin override badge if applicable
  if (gates.isAdminOverride) {
    return (
      <div className={`flex items-center gap-2 px-3 py-2 bg-yellow-50 border border-yellow-200 rounded-md ${className}`}>
        <Shield className="h-4 w-4 text-yellow-700" />
        <span className="text-sm text-yellow-900">
          <strong>Admin Override:</strong> Todas as funcionalidades estão habilitadas
        </span>
      </div>
    );
  }
  
  // Check if any features are disabled
  const disabledFeatures = [];
  
  if (!gates.isTransferGraphEnabled) disabledFeatures.push('Transfer Graph');
  if (!gates.isPkmEnabled) disabledFeatures.push('Atomic Notes');
  if (!gates.isGamesEnabled) disabledFeatures.push('Games');
  if (!gates.allowOcr) disabledFeatures.push('OCR');
  if (!gates.allowTextExtraction) disabledFeatures.push('Full Summary');
  if (!gates.isSentenceAnalysisEnabled) disabledFeatures.push('Sentence Analysis');
  if (!gates.isMissionFeedbackEnabled) disabledFeatures.push('Mission Feedback');
  if (!gates.isHuggingEnabled) disabledFeatures.push('Generality Prompts');
  
  // Don't show if all features are enabled
  if (disabledFeatures.length === 0) {
    return null;
  }
  
  return (
    <div className={`flex items-center gap-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded-md ${className}`}>
      <Info className="h-4 w-4 text-blue-700" />
      <div className="text-sm text-blue-900">
        {disabledFeatures.length === 1 ? (
          <span>
            <strong>{disabledFeatures[0]}</strong> está desabilitado pela política institucional.
          </span>
        ) : disabledFeatures.length <= 3 ? (
          <span>
            <strong>{disabledFeatures.join(', ')}</strong> estão desabilitados pela política institucional.
          </span>
        ) : (
          <span>
            Algumas funcionalidades estão desabilitadas pela política institucional.
          </span>
        )}
      </div>
    </div>
  );
}

/**
 * Compact version for header/toolbar
 */
export function PolicyIndicatorCompact({ policy, userRole }: PolicyIndicatorProps) {
  const gates = usePolicy({ policy, userRole });
  
  // Show admin badge if override
  if (gates.isAdminOverride) {
    return (
      <div className="flex items-center gap-1.5 text-xs text-yellow-700 bg-yellow-100 px-2 py-1 rounded-full">
        <Shield className="h-3 w-3" />
        <span className="font-medium">Admin</span>
      </div>
    );
  }
  
  // Count disabled features
  const disabledCount = [
    !gates.isTransferGraphEnabled,
    !gates.isPkmEnabled,
    !gates.isGamesEnabled,
    !gates.allowOcr,
    !gates.allowTextExtraction,
    !gates.isSentenceAnalysisEnabled,
    !gates.isMissionFeedbackEnabled,
    !gates.isHuggingEnabled,
  ].filter(Boolean).length;
  
  if (disabledCount === 0) {
    return null;
  }
  
  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <Info className="h-3 w-3" />
      <span>{disabledCount} {disabledCount === 1 ? 'funcionalidade' : 'funcionalidades'} desabilitada{disabledCount === 1 ? '' : 's'}</span>
    </div>
  );
}
