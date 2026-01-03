import { useCallback, useRef, useEffect } from 'react';

// Plugin imports
import { highlightPlugin, Trigger, RenderHighlightsProps } from '@react-pdf-viewer/highlight';
import { searchPlugin } from '@react-pdf-viewer/search';
import { thumbnailPlugin } from '@react-pdf-viewer/thumbnail';
import { bookmarkPlugin } from '@react-pdf-viewer/bookmark';

// Component imports
import { PDFSelectionMenu } from '@/components/cornell/viewers/pdf';

interface UsePDFPluginsProps {
  // Handlers
  renderHighlights: (props: RenderHighlightsProps) => React.ReactElement;
  handleHighlightCreation: (area: any, typeKey?: string) => Promise<void>;
  onSelectionAction?: (action: any, text: string, data?: any) => void;
  selectedColor: string;
}

/**
 * usePDFPlugins - Hook to manage PDF Viewer plugins configuration
 * Encapsulates the complexity of plugin initialization, refs for stability, and memoization.
 * 
 * NOTE: defaultLayoutPlugin is currently disabled due to React "Should have a queue" error.
 * The viewer will work without custom toolbar until this is resolved.
 */
export function usePDFPlugins({
  renderHighlights,
  handleHighlightCreation,
  onSelectionAction,
  selectedColor,
}: UsePDFPluginsProps) {

  // --- 1. Refs for Stability ---
  // We use refs to allow plugins to access the latest state/callbacks 
  // without needing to be re-instantiated on every render.

  const callbacksRef = useRef({
    handleHighlightCreation,
    onSelectionAction,
    selectedColor
  });

  // Update refs on every render
  useEffect(() => {
    callbacksRef.current = {
      handleHighlightCreation,
      onSelectionAction,
      selectedColor
    };
  });

  // --- 2. Plugin Instantiation ---

  // Stable callback for selection menu to ensure plugin stability
  const renderHighlightTarget = useCallback((props: any) => (
    <PDFSelectionMenu 
      props={props} 
      handleHighlightCreation={(p, t) => callbacksRef.current.handleHighlightCreation(p, t)}
      onSelectionAction={(a, t, d) => callbacksRef.current.onSelectionAction?.(a, t, d)}
      selectedColor={callbacksRef.current.selectedColor}
    />
  ), []);

  // Highlight Plugin: Instantiated directly to follow Rules of Hooks
  // We pass stable 'renderHighlightTarget' and 'renderHighlights' to hope for internal memoization stability
  const highlightPluginInstance = highlightPlugin({
    renderHighlights,
    trigger: Trigger.TextSelection,
    renderHighlightTarget,
  });

  // Standard Plugins: Instantiated directly
  const thumbnailPluginInstance = thumbnailPlugin();
  const bookmarkPluginInstance = bookmarkPlugin();
  const searchPluginInstance = searchPlugin({
    enableShortcuts: true,
    keyword: '',
  });

  // --- 3. Gather Exports ---

  return {
    // The array of plugins to pass to <Viewer />
    plugins: [
      // defaultLayoutPluginInstance,
      highlightPluginInstance,
      searchPluginInstance,
      thumbnailPluginInstance,
      bookmarkPluginInstance,
    ],
    // Components exposed by plugins
    Thumbnails: thumbnailPluginInstance.Thumbnails,
    Bookmarks: bookmarkPluginInstance.Bookmarks,
    // Methods exposed by plugins
    jumpToHighlightArea: highlightPluginInstance.jumpToHighlightArea,
  };
}
