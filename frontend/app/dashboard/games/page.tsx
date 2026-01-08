/**
 * Policy-Aware Games Dashboard Page
 * 
 * Wraps the Games page with policy gate checking.
 * If games are disabled by policy, shows appropriate message.
 */

'use client';

import GamesPage from './page-impl';
import { PolicyAwareFeature } from '@/components/shared/PolicyAwareFeature';

export default function PolicyAwareGamesPage() {
  // TODO: Get user role and session policy from context
  // For now, using undefined which applies safe defaults (games enabled)
  const userRole = undefined;
  const sessionPolicy = undefined;
  
  return (
    <PolicyAwareFeature
      featureGate="games"
      featureName="Jogos Pedagógicos"
      policy={sessionPolicy}
      userRole={userRole}
      fallbackMessage="Os jogos pedagógicos estão desabilitados pela política institucional. Entre em contato com seu educador para mais informações."
    >
      <GamesPage />
    </PolicyAwareFeature>
  );
}
