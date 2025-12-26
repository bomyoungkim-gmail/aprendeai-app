import { useMemo, useCallback } from 'react';
import { HIGHLIGHT_COLORS, getColorForKey, type ColorKey } from '@/lib/constants/colors';

/**
 * Custom hook for managing highlight color logic
 * Centralizes color-related utilities and memoizes expensive operations
 */
export function useHighlightColor(colorKey: string) {
  const color = useMemo(
    () => HIGHLIGHT_COLORS[colorKey as ColorKey] || HIGHLIGHT_COLORS.yellow,
    [colorKey]
  );

  const rgb = useMemo(() => getColorForKey(colorKey), [colorKey]);

  const withOpacity = useCallback(
    (opacity: string) => rgb + opacity,
    [rgb]
  );

  return {
    color,
    rgb,
    withOpacity,
    emoji: color.emoji,
    name: color.name,
  };
}
