'use client';

import { motion } from 'framer-motion';

interface StarAnimationProps {
  stars: number; // 0-3
  size?: 'sm' | 'md' | 'lg';
}

/**
 * Animated star display
 * Uses framer-motion for smooth animations
 */
export function StarAnimation({ stars, size = 'md' }: StarAnimationProps) {
  const sizes = {
    sm: 'text-xl',
    md: 'text-3xl',
    lg: 'text-5xl',
  };

  return (
    <div className="flex gap-1">
      {[...Array(3)].map((_, i) => (
        <motion.span
          key={i}
          initial={{ scale: 0, rotate: -180 }}
          animate={{ 
            scale: i < stars ? [0, 1.5, 1] : 1,
            rotate: i < stars ? 0 : -180,
          }}
          transition={{
            duration: 0.5,
            delay: i * 0.1,
            ease: 'easeOut',
          }}
          className={sizes[size]}
        >
          {i < stars ? '⭐' : '☆'}
        </motion.span>
      ))}
    </div>
  );
}
