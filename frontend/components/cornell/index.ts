// Barrel export for Cornell components
// Usage: import { StreamCard, ModernCornellLayout } from '@/components/cornell';

// Main Layouts
// @deprecated Use ModernCornellLayout instead
export { CornellLayout } from './classic/CornellLayout';
export { ModernCornellLayout } from './ModernCornellLayout';

// UI Components
// @deprecated Part of classic layout
export { TopBar } from './classic/TopBar';
export { SaveStatusIndicator } from './SaveStatusIndicator';
export { ActionToolbar } from './ActionToolbar';
export { SearchBar } from './SearchBar';
export { SuggestionsPanel } from './SuggestionsPanel';
export { TextSelectionMenu } from './TextSelectionMenu';
export { AIChatPanel } from './AIChatPanel';
export { ReadingProgressBar } from './ReadingProgressBar';

// Editors
// @deprecated Part of classic layout
export { CuesEditor } from './classic/CuesEditor';
// @deprecated Part of classic layout
export { NotesEditor } from './classic/NotesEditor';
// @deprecated Part of classic layout
export { SummaryEditor } from './classic/SummaryEditor';
export { AnnotationEditor, NoteEditor } from './InlineEditor';

// Cards
export { StreamCard } from './StreamCard';
export { DeleteButton } from './DeleteButton';

// Hooks (re-export from hooks folder)
export { useCardEditor } from '@/hooks/cornell/use-card-editor';

// Types (commonly used)
export type { FilterType } from './SearchBar';
export type { SelectionAction } from './TextSelectionMenu';
export type { DeleteButtonVariant } from './DeleteButton';
