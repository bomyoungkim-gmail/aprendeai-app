/**
 * Color constants for PDF highlights
 */

export const HIGHLIGHT_COLORS = {
  yellow: {
    key: 'yellow',
    rgb: 'rgba(255, 235, 59, 0.3)',
    emoji: '💛',
    name: 'Amarelo',
  },
  green: {
    key: 'green',
    rgb: 'rgba(76, 175, 80, 0.3)',
    emoji: '💚',
    name: 'Verde',
  },
  blue: {
    key: 'blue',
    rgb: 'rgba(33, 150, 243, 0.3)',
    emoji: '💙',
    name: 'Azul',
  },
  red: {
    key: 'red',
    rgb: 'rgba(244, 67, 54, 0.3)',
    emoji: '❤️',
    name: 'Vermelho',
  },
  purple: {
    key: 'purple',
    rgb: 'rgba(156, 39, 176, 0.3)',
    emoji: '💜',
    name: 'Roxo',
  },
  pink: {
    key: 'pink',
    rgb: 'rgba(233, 30, 99, 0.3)',
    emoji: '💗',
    name: 'Rosa',
  },
  orange: {
    key: 'orange',
    rgb: 'rgba(255, 152, 0, 0.3)',
    emoji: '🧡',
    name: 'Laranja',
  },
} as const;

export type ColorKey = keyof typeof HIGHLIGHT_COLORS;

/**
 * Default color palette shown in UI (4 colors: Red, Yellow, Green, Blue)
 */
export const DEFAULT_COLOR_PALETTE: ColorKey[] = ['red', 'yellow', 'green', 'blue'];

/**
 * Default initial color for new highlights
 */
export const DEFAULT_COLOR: ColorKey = 'red';

/**
 * Get RGB color value for a highlight color key
 */
export function getColorForKey(colorKey: string): string {
  return HIGHLIGHT_COLORS[colorKey as ColorKey]?.rgb || HIGHLIGHT_COLORS.yellow.rgb;
}

/**
 * Get emoji for a highlight color key
 */
export function getEmojiForColor(colorKey: string): string {
  return HIGHLIGHT_COLORS[colorKey as ColorKey]?.emoji || '💡';
}

/**
 * Get all available color keys in the default palette
 */
export function getDefaultPalette(): ColorKey[] {
  return DEFAULT_COLOR_PALETTE;
}
