/**
 * Types Index
 * 
 * Central export point for all type definitions
 */

// Domain types
export * from './cornell';
export * from './family';
export * from './study-groups';
export * from './unified-stream';

// UI types (NEW) - explicitly exported to avoid conflicts
export type {
  FilterType,
  SortType,
  ViewMode as UIViewMode,  // Renamed to avoid conflict with cornell ViewMode
  DrawerState,
  ModalSize,
  LoadingState,
  MessageStatus,
  ConnectionStatus,
  Theme,
  ColorScheme,
  SidebarPosition,
  PanelOrientation,
  Direction,
  Alignment,
  ComponentSize,
} from './ui';
