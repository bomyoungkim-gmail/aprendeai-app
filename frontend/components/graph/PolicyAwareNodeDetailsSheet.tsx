/**
 * Policy-Aware Node Details Sheet
 * 
 * Wraps the NodeDetailsSheet with PKM policy checking.
 * Hides the "Create Note" functionality if PKM is disabled.
 */

'use client';

import { NodeDetailsSheet } from './NodeDetailsSheet';
import { PolicyGatedFeature } from '@/components/shared/PolicyAwareFeature';
import type { GraphNode } from '@/hooks/graph/use-learner-graph';
import type { DecisionPolicyV1 } from '@/types/session';

interface PolicyAwareNodeDetailsSheetProps {
  node: GraphNode | null;
  onClose: () => void;
  policy?: DecisionPolicyV1;
  userRole?: 'LEARNER' | 'EDUCATOR' | 'ADMIN' | 'PARENT';
}

/**
 * Policy-aware version of NodeDetailsSheet.
 * The sheet itself will always show, but PKM features (note creation) will be gated.
 * 
 * @example
 * ```tsx
 * <PolicyAwareNodeDetailsSheet
 *   node={selectedNode}
 *   onClose={() => setSelectedNode(null)}
 *   policy={session?.decision_policy}
 *   userRole={user?.role}
 * />
 * ```
 */
export function PolicyAwareNodeDetailsSheet({
  node,
  onClose,
  policy,
  userRole,
}: PolicyAwareNodeDetailsSheetProps) {
  return (
    <NodeDetailsSheet
      node={node}
      onClose={onClose}
      policy={policy}
      userRole={userRole}
    />
  );
}

