/**
 * Example: Policy-Aware Feature Button
 * 
 * This component demonstrates how to use the usePolicy hook
 * to conditionally render UI based on DecisionPolicyV1 gates.
 * 
 * Pattern:
 * 1. Get session from useSession hook
 * 2. Pass decision_policy to usePolicy hook
 * 3. Check relevant gate
 * 4. Return null or disabled state if feature is disabled
 */

import { usePolicy } from '@/hooks/use-policy';

interface PolicyAwareFeatureButtonProps {
  sessionPolicy?: any; // DecisionPolicyV1 from session
  featureGate: 'transfer' | 'pkm' | 'games' | 'ocr' | 'textExtraction';
  onClick: () => void;
  children: React.ReactNode;
  className?: string;
}

/**
 * Example component showing policy-aware UI pattern
 */
export function PolicyAwareFeatureButton({
  sessionPolicy,
  featureGate,
  onClick,
  children,
  className = '',
}: PolicyAwareFeatureButtonProps) {
  const policy = usePolicy({ policy: sessionPolicy });
  
  // Map feature gate to policy check
  const isEnabled = (() => {
    switch (featureGate) {
      case 'transfer':
        return policy.isTransferGraphEnabled;
      case 'pkm':
        return policy.isPkmEnabled;
      case 'games':
        return policy.isGamesEnabled;
      case 'ocr':
        return policy.allowOcr;
      case 'textExtraction':
        return policy.allowTextExtraction;
      default:
        return true;
    }
  })();
  
  // Option 1: Hide completely if disabled
  if (!isEnabled) {
    return null;
  }
  
  // Option 2: Show disabled with native tooltip (alternative)
  // if (!isEnabled) {
  //   return (
  //     <button
  //       disabled
  //       className={`px-4 py-2 bg-gray-200 text-gray-500 rounded cursor-not-allowed ${className}`}
  //       title="Esta funcionalidade está desabilitada pela política institucional"
  //     >
  //       {children}
  //     </button>
  //   );
  // }
  
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 ${className}`}
    >
      {children}
    </button>
  );
}

/**
 * Usage Example:
 * 
 * ```tsx
 * import { useSession } from '@/hooks/sessions/reading/use-session';
 * import { PolicyAwareFeatureButton } from '@/components/reading/PolicyAwareFeatureButton';
 * 
 * function MyComponent({ contentId }: { contentId: string }) {
 *   const { session } = useSession(contentId);
 *   
 *   return (
 *     <div>
 *       <PolicyAwareFeatureButton
 *         sessionPolicy={session?.decision_policy}
 *         featureGate="transfer"
 *         onClick={() => console.log('Transfer clicked')}
 *       >
 *         Transfer Graph
 *       </PolicyAwareFeatureButton>
 *       
 *       <PolicyAwareFeatureButton
 *         sessionPolicy={session?.decision_policy}
 *         featureGate="pkm"
 *         onClick={() => console.log('PKM clicked')}
 *       >
 *         Create Atomic Note
 *       </PolicyAwareFeatureButton>
 *     </div>
 *   );
 * }
 * ```
 */
