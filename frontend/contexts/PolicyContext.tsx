/**
 * Policy-Aware Feature Hooks
 * 
 * Utility hooks for accessing policy and user context in policy-aware components.
 * These hooks provide a simple way to get policy data without prop drilling.
 */

'use client';

import { createContext, useContext, ReactNode } from 'react';
import type { DecisionPolicyV1 } from '@/types/session';

interface PolicyContextValue {
  policy?: DecisionPolicyV1;
  userRole?: 'LEARNER' | 'EDUCATOR' | 'ADMIN' | 'PARENT';
}

const PolicyContext = createContext<PolicyContextValue>({});

/**
 * Provider for policy context
 * Wrap your app or specific routes with this to provide policy data
 */
export function PolicyProvider({ 
  children, 
  policy, 
  userRole 
}: { 
  children: ReactNode;
  policy?: DecisionPolicyV1;
  userRole?: 'LEARNER' | 'EDUCATOR' | 'ADMIN' | 'PARENT';
}) {
  return (
    <PolicyContext.Provider value={{ policy, userRole }}>
      {children}
    </PolicyContext.Provider>
  );
}

/**
 * Hook to access policy context
 * Use this in components that need policy data
 */
export function usePolicyContext() {
  return useContext(PolicyContext);
}
