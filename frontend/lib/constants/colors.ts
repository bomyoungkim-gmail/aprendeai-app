/**
 * Color constants for PDF highlights
 */

export const HIGHLIGHT_COLORS = {
  yellow: {
    key: 'yellow',
    rgb: 'rgba(255, 235, 59, 0.8)', // Amarelo (Opacity 0.8 centralized)
    emoji: '💛',
    name: 'Amarelo',
  },
  green: {
    key: 'green',
    rgb: 'rgba(76, 175, 80, 0.8)', // Verde
    emoji: '💚',
    name: 'Verde',
  },
  blue: {
    key: 'blue',
    rgb: 'rgba(33, 150, 243, 0.8)', // Azul
    emoji: '💙',
    name: 'Azul',
  },
  red: {
    key: 'red',
    rgb: 'rgba(244, 67, 54, 0.8)', // Vermelho
    emoji: '❤️',
    name: 'Vermelho',
  },
  purple: {
    key: 'purple',
    rgb: 'rgba(156, 39, 176, 0.8)', // Roxo
    emoji: '💜',
    name: 'Roxo',
  },
  pink: {
    key: 'pink',
    rgb: 'rgba(233, 30, 99, 0.8)', // Rosa
    emoji: '💗',
    name: 'Rosa',
  },
  orange: {
    key: 'orange',
    rgb: 'rgba(255, 152, 0, 0.8)', // Laranja
    emoji: '🧡',
    name: 'Laranja',
  },
} as const;

export const TAILWIND_COLORS = {
  yellow: {
    bgColor: 'bg-yellow-50',
    textColor: 'text-yellow-700',
    borderColor: 'border-yellow-200',
  },
  green: {
    bgColor: 'bg-green-50',
    textColor: 'text-green-700',
    borderColor: 'border-green-200',
  },
  blue: {
    bgColor: 'bg-blue-50',
    textColor: 'text-blue-700',
    borderColor: 'border-blue-200',
  },
  red: {
    bgColor: 'bg-red-50',
    textColor: 'text-red-700',
    borderColor: 'border-red-200',
  },
  purple: {
    bgColor: 'bg-purple-50',
    textColor: 'text-purple-700',
    borderColor: 'border-purple-200',
  },
  pink: {
    bgColor: 'bg-pink-50',
    textColor: 'text-pink-700',
    borderColor: 'border-pink-200',
  },
  orange: {
    bgColor: 'bg-orange-50',
    textColor: 'text-orange-700',
    borderColor: 'border-orange-200',
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
