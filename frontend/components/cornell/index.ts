// Barrel export for Cornell components
// Usage: import { StreamCard, ModernCornellLayout } from '@/components/cornell';

// Main Layouts
export { CornellLayout } from './CornellLayout';
export { ModernCornellLayout } from './ModernCornellLayout';

// UI Components
export { TopBar } from './TopBar';
export { SaveStatusIndicator } from './SaveStatusIndicator';
export { ActionToolbar } from './ActionToolbar';
export { SearchBar } from './SearchBar';
export { SuggestionsPanel } from './SuggestionsPanel';
export { TextSelectionMenu } from './TextSelectionMenu';
export { AIChatPanel } from './AIChatPanel';
export { ReadingProgressBar } from './ReadingProgressBar';

// Editors
export { CuesEditor } from './CuesEditor';
export { NotesEditor } from './NotesEditor';
export { SummaryEditor } from './SummaryEditor';
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
