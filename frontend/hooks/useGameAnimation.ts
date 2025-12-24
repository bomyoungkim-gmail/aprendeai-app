import { useCallback } from 'react';
import confetti from 'canvas-confetti';

/**
 * Hook for game animations
 * Encapsulates canvas-confetti and framer-motion logic
 */
export function useGameAnimation() {
  // Confetti for 3 stars
  const celebrateThreeStars = useCallback(() => {
    const duration = 3000;
    const end = Date.now() + duration;

    const colors = ['#FFD700', '#FFA500', '#FF6347']; // Gold, orange, red

    (function frame() {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors,
      });
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors,
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    })();
  }, []);

  // Confetti for any completion
  const celebrate = useCallback((stars: number) => {
    if (stars === 3) {
      celebrateThreeStars();
    } else if (stars >= 1) {
      confetti({
        particleCount: 50,
        spread: 70,
        origin: { y: 0.6 },
      });
    }
  }, [celebrateThreeStars]);

  // Star burst animation
  const starBurst = useCallback(() => {
    confetti({
      particleCount: 100,
      spread: 160,
      origin: { y: 0.5 },
      shapes: ['star'],
      colors: ['#FFD700'],
    });
  }, []);

  return {
    celebrate,
    celebrateThreeStars,
    starBurst,
  };
}
