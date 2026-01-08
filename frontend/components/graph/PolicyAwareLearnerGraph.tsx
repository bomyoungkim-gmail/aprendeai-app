/**
 * Policy-Aware Learner Graph Wrapper
 * 
 * Wraps the LearnerGraph component with transfer graph policy checking.
 * This is the recommended way to use LearnerGraph in policy-aware contexts.
 */

'use client';

import { PolicyAwareFeature } from '@/components/shared/PolicyAwareFeature';
import { LearnerGraph } from './LearnerGraph';
import type { DecisionPolicyV1 } from '@/types/session';

interface PolicyAwareLearnerGraphProps {
  contentId: string;
  onNavigate?: (page: number, scrollPct?: number) => void;
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
  policy?: DecisionPolicyV1;
  userRole?: 'LEARNER' | 'EDUCATOR' | 'ADMIN' | 'PARENT';
}

/**
 * Use this component instead of LearnerGraph directly when policy awareness is needed.
 * 
 * @example
 * ```tsx
 * <PolicyAwareLearnerGraph
 *   contentId={contentId}
 *   policy={session?.decision_policy}
 *   userRole={user?.role}
 *   onNavigate={handleNavigate}
 * />
 * ```
 */
export function PolicyAwareLearnerGraph({
  contentId,
  onNavigate,
  isFullscreen,
  onToggleFullscreen,
  policy,
  userRole,
}: PolicyAwareLearnerGraphProps) {
  return (
    <PolicyAwareFeature
      featureGate="transfer"
      featureName="Transfer Graph (Grafo de Conhecimento)"
      policy={policy}
      userRole={userRole}
      fallbackMessage="O Transfer Graph está desabilitado pela política institucional. Esta funcionalidade permite visualizar seu progresso de aprendizado em forma de grafo."
    >
      <LearnerGraph
        contentId={contentId}
        onNavigate={onNavigate}
        isFullscreen={isFullscreen}
        onToggleFullscreen={onToggleFullscreen}
        policy={policy}
        userRole={userRole}
      />
    </PolicyAwareFeature>
  );
}
