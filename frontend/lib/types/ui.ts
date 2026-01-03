/**
 * UI Types - Shared UI State Types
 * 
 * Centralized location for UI-related types that are shared across
 * components and hooks. This prevents circular dependencies and
 * keeps type definitions DRY.
 */

// ========================================
// FILTER & SORT TYPES
// ========================================

/**
 * Filter types for content/annotation filtering
 * Matches actual usage in Cornell components
 */
export type FilterType = 
  | 'all' 
  | 'evidence'        // Highlights/annotations
  | 'vocabulary'      // Vocabulary notes
  | 'main-idea'       // Main ideas
  | 'doubt'           // Doubts/questions
  | 'synthesis';      // Synthesis/summaries

/**
 * Sort types for content ordering
 */
export type SortType = 
  | 'date' 
  | 'relevance' 
  | 'alphabetical'
  | 'priority';

/**
 * View mode types for layout
 */
export type ViewMode = 
  | 'grid' 
  | 'list' 
  | 'timeline'
  | 'compact';

// ========================================
// DRAWER & MODAL TYPES
// ========================================

/**
 * Drawer state for collapsible sidebars
 */
export type DrawerState = 
  | 'collapsed' 
  | 'peek' 
  | 'expanded';

/**
 * Modal size variants
 */
export type ModalSize = 
  | 'sm'   // Small (max-w-md)
  | 'md'   // Medium (max-w-lg)
  | 'lg'   // Large (max-w-2xl)
  | 'xl'   // Extra Large (max-w-4xl)
  | 'full'; // Full screen

// ========================================
// STATUS & STATE TYPES
// ========================================

/**
 * Loading states for async operations
 */
export type LoadingState = 
  | 'idle'
  | 'loading'
  | 'success'
  | 'error';

/**
 * Message status for chat/prompts
 */
export type MessageStatus = 
  | 'sending'
  | 'sent'
  | 'delivered'
  | 'error';

/**
 * Connection status
 */
export type ConnectionStatus = 
  | 'connected'
  | 'disconnected'
  | 'connecting'
  | 'reconnecting';

// ========================================
// THEME & APPEARANCE
// ========================================

/**
 * Theme options
 */
export type Theme = 
  | 'light'
  | 'dark'
  | 'system';

/**
 * Color scheme variants
 */
export type ColorScheme = 
  | 'blue'
  | 'green'
  | 'purple'
  | 'orange'
  | 'red';

// ========================================
// LAYOUT TYPES
// ========================================

/**
 * Sidebar position
 */
export type SidebarPosition = 
  | 'left'
  | 'right';

/**
 * Panel orientation
 */
export type PanelOrientation = 
  | 'horizontal'
  | 'vertical';

// ========================================
// UTILITY TYPES
// ========================================

/**
 * Direction for scrolling, animation, etc
 */
export type Direction = 
  | 'up'
  | 'down'
  | 'left'
  | 'right';

/**
 * Alignment options
 */
export type Alignment = 
  | 'start'
  | 'center'
  | 'end'
  | 'justify';

/**
 * Size variants for components
 */
export type ComponentSize = 
  | 'xs'
  | 'sm'
  | 'md'
  | 'lg'
  | 'xl';

// ========================================
// EXPORTS
// ========================================

// Re-export all types for convenience
export type {
  FilterType as Filter,
  SortType as Sort,
  ViewMode as View,
};
