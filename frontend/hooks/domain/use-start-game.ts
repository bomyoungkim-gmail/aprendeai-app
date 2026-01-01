/**
 * Start Game - Domain Hook
 * 
 * Handles the flow of starting a game:
 * - Validation
 * - Navigation
 * - User feedback
 */

import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

export function useStartGame() {
  const router = useRouter();
  
  const startGame = (gameId: string, gameName?: string) => {
    // Validation
    if (!gameId) {
      toast.error('Game ID inválido');
      return;
    }
    
    // Feedback
    const message = gameName 
      ? `Iniciando ${gameName}...` 
      : 'Iniciando jogo...';
    toast.success(message);
    
    // Navigation
    router.push(`/games/${gameId}/play`);
  };
  
  return {
    startGame,
  };
}
