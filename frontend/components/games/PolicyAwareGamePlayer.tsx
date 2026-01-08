/**
 * Policy-Aware Games Wrapper
 * 
 * Wraps the GamePlayer component with policy gate checking.
 * Hides games if disabled by policy (unless admin override).
 */

'use client';

import { usePolicy } from '@/hooks/use-policy';
import { GamePlayer } from './GamePlayer';
import type { DecisionPolicyV1 } from '@/types/session';
import { Info, Shield } from 'lucide-react';

interface PolicyAwareGamePlayerProps {
  gameId: string;
  gameName: string;
  onClose: () => void;
  onComplete: (score: number, won: boolean) => void;
  policy?: DecisionPolicyV1;
  userRole?: 'LEARNER' | 'EDUCATOR' | 'ADMIN' | 'PARENT';
}

/**
 * Games wrapper that respects policy gates
 */
export function PolicyAwareGamePlayer({
  gameId,
  gameName,
  onClose,
  onComplete,
  policy,
  userRole,
}: PolicyAwareGamePlayerProps) {
  const { isGamesEnabled, isAdminOverride } = usePolicy({ policy, userRole });
  
  // If games disabled and not admin, hide completely
  if (!isGamesEnabled && !isAdminOverride) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] p-8 text-center">
        <Info className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">Jogos Desabilitados</h3>
        <p className="text-sm text-muted-foreground max-w-md">
          Os jogos estão desabilitados pela política institucional.
          Entre em contato com seu educador para mais informações.
        </p>
        <button
          onClick={onClose}
          className="mt-6 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
        >
          Fechar
        </button>
      </div>
    );
  }
  
  // If admin override, show indicator
  if (isAdminOverride) {
    return (
      <div className="relative">
        {/* Admin override badge */}
        <div className="absolute top-2 right-2 z-50 flex items-center gap-2 bg-yellow-100 text-yellow-900 px-3 py-1 rounded-full text-xs font-medium">
          <Shield className="h-3 w-3" />
          Admin Override
        </div>
        
        <GamePlayer
          gameId={gameId}
          gameName={gameName}
          onClose={onClose}
          onComplete={onComplete}
        />
      </div>
    );
  }
  
  // Normal flow - games enabled
  return (
    <GamePlayer
      gameId={gameId}
      gameName={gameName}
      onClose={onClose}
      onComplete={onComplete}
    />
  );
}
