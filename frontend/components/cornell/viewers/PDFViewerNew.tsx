'use client';

import React, { useState, useEffect, useRef, useLayoutEffect, forwardRef } from 'react';
import { Viewer, Worker, SpecialZoomLevel, ScrollMode } from '@react-pdf-viewer/core';
import { defaultLayoutPlugin } from '@react-pdf-viewer/default-layout';
import { highlightPlugin, Trigger } from '@react-pdf-viewer/highlight';
import { searchPlugin } from '@react-pdf-viewer/search';
import { thumbnailPlugin } from '@react-pdf-viewer/thumbnail';
import { bookmarkPlugin } from '@react-pdf-viewer/bookmark';
import { Grid, Bookmark, X, Highlighter, MessageSquare, HelpCircle, Sparkles, Star, BookOpen } from 'lucide-react';
import type { RenderHighlightsProps, RenderHighlightTargetProps } from '@react-pdf-viewer/highlight';

import '@react-pdf-viewer/core/lib/styles/index.css';
import '@react-pdf-viewer/default-layout/lib/styles/index.css';
import '@react-pdf-viewer/highlight/lib/styles/index.css';
import '@react-pdf-viewer/thumbnail/lib/styles/index.css';
import '@react-pdf-viewer/bookmark/lib/styles/index.css';

import type { Content, Highlight as BackendHighlight, ViewMode } from '@/lib/types/cornell';
import {
  convertHighlightsToReactPDF,
  reactPDFToBackend,
  type ReactPDFHighlight,
} from '@/lib/adapters/highlight-adapter';
import { getColorForKey } from '@/lib/constants/colors';
import { PDFToolbar } from './PDFToolbar';
import { AIAssistMenu } from './AIAssistMenu';
import { logger } from '@/lib/utils/logger';

interface PDFViewerProps {
  content: Content;
  mode: ViewMode;
  highlights?: BackendHighlight[];
  onCreateHighlight?: (highlight: any) => Promise<void>;
  selectedColor?: string;
  onSelectionAction?: (action: 'note' | 'question' | 'ai' | 'star' | 'triage' | 'annotation', text: string, data?: any) => void;
  onPageChange?: (page: number) => void;
}

// Internal component to handle menu positioning to keep it in viewport
const PositionedMenu = forwardRef<HTMLDivElement, { 
  props: RenderHighlightTargetProps, 
  handleHighlightCreation: (props: any) => void,
  onSelectionAction?: (action: any, text: any, data: any) => void,
  selectedColor: string
}>(({ 
  props, 
  handleHighlightCreation, 
  onSelectionAction, 
  selectedColor,
}, ref) => {
  const internalRef = useRef<HTMLDivElement>(null);
  const [positionStyle, setPositionStyle] = useState<React.CSSProperties>({
    position: 'absolute',
    left: `${props.selectionRegion.left}%`,
    top: `${props.selectionRegion.top + props.selectionRegion.height}%`,
    transform: 'translate(-50%, 8px)',
    zIndex: 999,
  });

  useLayoutEffect(() => {
    if (internalRef.current) {
      const rect = internalRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      
      let newTransform = 'translate(-50%, 8px)';
      
      // Check left overflow
      if (rect.left < 10) {
        const overflow = 10 - rect.left;
        newTransform = `translate(calc(-50% + ${overflow}px), 8px)`;
      } else if (rect.right > viewportWidth - 10) {
         const overflow = rect.right - (viewportWidth - 10);
         newTransform = `translate(calc(-50% - ${overflow}px), 8px)`;
      }

      setPositionStyle(prev => ({
        ...prev,
        transform: newTransform
      }));
    }
  }, [props.selectionRegion]);

  const buttonClass = "flex flex-col items-center justify-center p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors gap-1 min-w-[60px]";
  const labelClass = "text-[10px] font-medium text-gray-600 dark:text-gray-400";

  return (
    <div
      ref={(node) => {
        // Handle both refs: internal for logic, forwarded for parent
        (internalRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
        if (typeof ref === 'function') {
          ref(node);
        } else if (ref) {
          (ref as React.MutableRefObject<HTMLDivElement | null>).current = node;
        }
      }}
      style={positionStyle}
      className="bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 flex items-center p-1 animate-in fade-in zoom-in-95 duration-200"
      onMouseDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Highlight - 🎨 */}
      <button 
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => {
          e.stopPropagation();
          handleHighlightCreation(props); 
          props.toggle();
        }}
        className={buttonClass}
        title="Destaque"
      >
        <Highlighter className="h-4 w-4" style={{ color: getColorForKey(selectedColor) }} />
        <span className={labelClass}>Destacar</span>
      </button>

      {/* Note - 💬 */}
      <button 
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => {
          e.stopPropagation();
          onSelectionAction?.('note', props.selectedText, props);
          props.toggle();
        }}
        className={buttonClass}
        title="Nota"
      >
        <MessageSquare className="h-4 w-4 text-blue-500" />
        <span className={labelClass}>Nota</span>
      </button>

      {/* Star - ⭐ */}
      <button 
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => {
          e.stopPropagation();
          onSelectionAction?.('star', props.selectedText, props);
          props.toggle();
        }}
        className={buttonClass}
        title="Importante"
      >
        <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
        <span className={labelClass}>Importante</span> 
      </button>

      {/* Question - ❓ */}
      <button 
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => {
          e.stopPropagation();
          onSelectionAction?.('question', props.selectedText, props);
          props.toggle();
        }}
        className={buttonClass}
        title="Dúvida"
      >
        <HelpCircle className="h-4 w-4 text-red-500" />
        <span className={labelClass}>Dúvida</span>
      </button>

      <div className="w-px h-8 bg-gray-200 dark:bg-gray-700 mx-1" />

      {/* AI - 🤖 */}
      <button 
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => {
          e.stopPropagation();
          onSelectionAction?.('ai', props.selectedText, props);
          props.toggle();
        }}
        className={`${buttonClass} relative group`}
        title="Assistente IA"
      >
        <Sparkles className="h-4 w-4 text-purple-600 animate-pulse" />
        <span className={`${labelClass} text-purple-600 font-bold`}>IA</span>
      </button>
      
      {/* Triage - 📖 */}
       <button 
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => {
          e.stopPropagation();
          onSelectionAction?.('triage', props.selectedText, props);
          props.toggle();
        }}
        className={buttonClass}
        title="Triagem"
      >
        <BookOpen className="h-4 w-4 text-gray-500" />
        <span className={labelClass}>Triagem</span>
      </button>

      {/* Triangle Arrow */}
      <div 
        className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white dark:bg-gray-800 border-t border-l border-gray-200 dark:border-gray-700 transform rotate-45"
      />
    </div>
  );
});

PositionedMenu.displayName = 'PositionedMenu';

export function PDFViewer({ 
  content, 
  mode, 
  highlights = [], 
  onCreateHighlight, 
  selectedColor = 'yellow',
  onSelectionAction,
  onPageChange: onPageChangeProp
}: PDFViewerProps) {
  const [pdfUrl, setPdfUrl] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [zoom, setZoom] = useState(1.0);
  const [showAIMenu, setShowAIMenu] = useState(false);
  const [selectedText, setSelectedText] = useState<string>('');
  const [activeSidebar, setActiveSidebar] = useState<'thumbnails' | 'bookmarks' | null>(null);
  const fileUrl = content.file?.viewUrl;

  // Fetch PDF with authentication and create blob URL
  useEffect(() => {
    if (!fileUrl) {
      setError('No file URL provided');
      setLoading(false);
      return;
    }

    const fetchPDF = async () => {
      try {
        setLoading(true);
        // Get token from store directly to ensure we have value even if localStorage format is different
        const { useAuthStore } = await import('@/stores/auth-store');
        const token = useAuthStore.getState().token;
        
        if (!token) {
          logger.error('PDF Fetch: No token found in auth store');
          throw new Error('Authentication token missing. Please log in again.');
        }

        logger.debug('PDF Fetch: Starting request', { fileUrl });
        
        const response = await fetch(fileUrl, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error(`Failed to load PDF: ${response.statusText}`);
        }

        const blob = await response.blob();
        const blobUrl = URL.createObjectURL(blob);
        setPdfUrl(blobUrl);
        setError('');
      } catch (err) {
        logger.error('PDF fetch failed', err, { fileUrl });
        setError(err instanceof Error ? err.message : 'Failed to load PDF');
      } finally {
        setLoading(false);
      }
    };

    fetchPDF();

    // Cleanup blob URL on unmount
    return () => {
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
      }
    };
  }, [fileUrl]);

  // Convert backend highlights to ReactPDF format
  const reactPDFHighlights = convertHighlightsToReactPDF(highlights);

  // Render highlights
  const renderHighlights = (props: RenderHighlightsProps) => (
    <div>
      {reactPDFHighlights
        .filter((h) => h.position.pageIndex === props.pageIndex)
        .map((highlight) => (
          <React.Fragment key={highlight.id}>
            {highlight.highlightAreas
              .filter((area) => area.pageIndex === props.pageIndex)
              .map((area, idx) => (
                <div
                  key={idx}
                  className="highlight-area"
                  style={{
                    background: getColorForKey(highlight.colorKey),
                    opacity: 0.7,
                    position: 'absolute',
                    left: `${area.left}%`,
                    top: `${area.top}%`,
                    width: `${area.width}%`,
                    height: `${area.height}%`,
                    cursor: 'pointer',
                    pointerEvents: 'auto',
                  }}
                  title={highlight.content.text}
                  onClick={() => {
                    if (highlight.comment?.message) {
                      alert(highlight.comment.message);
                    }
                  }}
                />
              ))}
          </React.Fragment>
        ))}
    </div>
  );

  // Transform and create highlight (hoisted for access in plugin)
  const handleHighlightCreation = async (area: any) => {
    if (!onCreateHighlight) return;

    // Handle RenderHighlightTargetProps structure vs direct object
    const region = area.selectionRegion || area;
    const text = area.selectedText || '';
    const pageIndex = region.pageIndex || 0;

    try {
      // Use highlightAreas array for multi-line selections
      // area.highlightAreas contains individual rects for each line segment
      let highlightAreas = area.highlightAreas || [
        {
          left: region.left,
          top: region.top,
          width: region.width,
          height: region.height,
          pageIndex: pageIndex,
        },
      ];

      // Filter out empty rects (width=0 or height=0)
      // Plugin sometimes includes empty spacer rects that don't render
      highlightAreas = highlightAreas.filter((h: any) => h.width > 0 && h.height > 0);

      // If all areas were filtered out, use fallback
      if (highlightAreas.length === 0) {
        highlightAreas = [
          {
            left: region.left,
            top: region.top,
            width: region.width,
            height: region.height,
            pageIndex: pageIndex,
          },
        ];
      }

      // Also collect all rects for position.rects (used by some highlight renderers)
      const rects = highlightAreas.map((h: any) => ({
        x1: h.left,
        y1: h.top,
        x2: h.left + h.width,
        y2: h.top + h.height,
        width: h.width,
        height: h.height,
        pageIndex: h.pageIndex || pageIndex,
      }));

      const backendFormat = reactPDFToBackend(
        {
          content: { text: text },
          position: {
            // BoundingRect is the overall bounding box
            boundingRect: {
              x1: region.left,
              y1: region.top,
              x2: region.left + region.width,
              y2: region.top + region.height,
              width: region.width,
              height: region.height,
              pageIndex: pageIndex,
            },
            rects: rects, // Individual line segments for multi-line
            pageIndex: pageIndex,
          },
          highlightAreas: highlightAreas, // All line segments
          comment: { emoji: '💛', message: '' },
        },
        content.id,
        '', // userId will be set by backend
        selectedColor
      );

      await onCreateHighlight(backendFormat);
    } catch (error) {
      logger.error('Failed to create highlight', error, { contentId: content.id });
    }
  };

  // Highlight plugin setup
  const highlightPluginInstance = highlightPlugin({
    renderHighlights,
    trigger: Trigger.TextSelection,
    renderHighlightTarget: (props: RenderHighlightTargetProps) => (
      <PositionedMenu 
        props={props} 
        handleHighlightCreation={handleHighlightCreation}
        onSelectionAction={onSelectionAction}
        selectedColor={selectedColor}
      />
    ),
  });

  const { jumpToHighlightArea } = highlightPluginInstance;

  // Plugins instances
  const thumbnailPluginInstance = thumbnailPlugin();
  const { Thumbnails } = thumbnailPluginInstance;

  const bookmarkPluginInstance = bookmarkPlugin();
  const { Bookmarks } = bookmarkPluginInstance;

  // Search plugin
  const searchPluginInstance = searchPlugin({
    enableShortcuts: true,
    keyword: '',
  });

  // Default layout config
  const defaultLayoutPluginInstance = defaultLayoutPlugin({
    sidebarTabs: (defaultTabs) => [], // Disable default sidebar to use our custom one
    renderToolbar: (Toolbar) => (
      <Toolbar>
        {(slots) => {
          const { 
            CurrentPageInput, 
            NumberOfPages, 
            EnterFullScreen, 
            Zoom, 
            ZoomIn, 
            ZoomOut, 
            GoToNextPage, 
            GoToPreviousPage
          } = slots;
          return (
            <div className="flex items-center justify-between w-full p-2 text-gray-700 dark:text-gray-200 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700 shadow-sm z-10 transition-colors duration-200">
               {/* Left: Custom Sidebar Toggles */}
               <div className="flex items-center gap-1 sm:gap-2">
                 <button
                   onClick={() => setActiveSidebar(activeSidebar === 'thumbnails' ? null : 'thumbnails')}
                   className={`p-1.5 rounded-lg transition-colors ${
                     activeSidebar === 'thumbnails' 
                       ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300' 
                       : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                   }`}
                   title="Miniaturas"
                 >
                   <Grid className="w-5 h-5" />
                 </button>
                 <button
                   onClick={() => setActiveSidebar(activeSidebar === 'bookmarks' ? null : 'bookmarks')}
                   className={`p-1.5 rounded-lg transition-colors ${
                     activeSidebar === 'bookmarks' 
                       ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300' 
                       : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                   }`}
                   title="Marcadores"
                 >
                   <Bookmark className="w-5 h-5" />
                 </button>
               </div>

               {/* Center: Zoom Controls */}
               <div className="flex items-center gap-2">
                <ZoomOut />
                <div className="transform scale-90">
                   <Zoom />
                </div>
                <ZoomIn />
              </div>

               {/* Right: Page Counter */}
               <div className="flex items-center gap-2 text-sm font-medium">
                 {totalPages > 0 && (
                   <span className="text-gray-700 dark:text-gray-300">
                     Página {currentPage} de {totalPages}
                   </span>
                 )}
               </div>
            </div>
          );
        }}
      </Toolbar>
    ),
  });

  // Store viewer API reference
  const viewerRef = React.useRef<any>(null);

  // Page navigation handlers
  const handlePreviousPage = () => {
    if (currentPage > 1 && viewerRef.current) {
      viewerRef.current.jumpToPage(currentPage - 2); // 0-indexed
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages && viewerRef.current) {
      viewerRef.current.jumpToPage(currentPage); // 0-indexed
    }
  };

  // Handle page change to update current page
  const handlePageChange = (e: { currentPage: number }) => {
    const newPage = e.currentPage + 1;
    setCurrentPage(newPage); // Convert from 0-indexed
    onPageChangeProp?.(newPage);
  };

  // Handle document load to get total pages
  const handleDocumentLoad = (e: { doc: any }) => {
    setTotalPages(e.doc.numPages);
  };

  // Handle text selection for creating highlights
  const handleTextSelection = highlightPluginInstance.switchTrigger;

  if (!fileUrl) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-500">No PDF file available</p>
      </div>
    );
  }

  return (
    <div className="h-full w-full relative">
      {/* Color Picker moved to Global Header */}

      {/* PDF Viewer with Worker - Responsive - Full Width/Height */}
      <Worker workerUrl="https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js">
        <div className="h-full w-full bg-white dark:bg-gray-900">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-white">Loading PDF...</div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-full bg-gray-900 p-4">
              <div className="text-red-400 text-center max-w-md">
                <svg 
                  className="h-12 w-12 sm:h-16 sm:w-16 mx-auto mb-4" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" 
                  />
                </svg>
                <p className="text-base sm:text-lg font-semibold mb-2">Failed to load PDF</p>
                <p className="text-xs sm:text-sm text-gray-400 mb-2">
                  {error}
                </p>
                <p className="text-xs text-gray-500">
                  Please check your internet connection and try again
                </p>
              </div>
            </div>
          ) : pdfUrl ? (
            <Viewer
              fileUrl={pdfUrl}
              plugins={[
                defaultLayoutPluginInstance,
                highlightPluginInstance,
                searchPluginInstance,
                thumbnailPluginInstance,
                bookmarkPluginInstance,
              ]}
              defaultScale={SpecialZoomLevel.PageWidth}
              scrollMode={ScrollMode.Vertical}
              onDocumentLoad={handleDocumentLoad}
              onPageChange={handlePageChange}
              ref={(ref) => {
                if (ref) {
                  viewerRef.current = ref;
                }
              }}
              renderError={(error) => (
                <div className="flex items-center justify-center h-full bg-gray-900 p-4">
                  <div className="text-red-400 text-center max-w-md">
                    <p className="text-base sm:text-lg font-semibold mb-2">Error rendering PDF</p>
                    <p className="text-xs sm:text-sm text-gray-400">{error.message}</p>
                  </div>
                </div>
              )}
            />
          ) : null}

          {/* Custom Sidebar Overlay */}
          {activeSidebar && pdfUrl && (
            <div className="absolute left-0 top-12 bottom-0 w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 z-20 shadow-xl animate-in slide-in-from-left duration-200">
              <div className="flex items-center justify-between p-3 border-b border-gray-200 dark:border-gray-700">
                <h3 className="font-medium text-sm text-gray-900 dark:text-gray-100">
                  {activeSidebar === 'thumbnails' ? 'Miniaturas' : 'Marcadores'}
                </h3>
                <button
                  onClick={() => setActiveSidebar(null)}
                  className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                >
                  <X className="w-4 h-4 text-gray-500" />
                </button>
              </div>
              <div className="overflow-auto h-[calc(100%-45px)] custom-scrollbar">
                 {activeSidebar === 'thumbnails' ? <Thumbnails /> : <Bookmarks />}
              </div>
            </div>
          )}
        </div>
      </Worker>


      {/* Custom CSS for responsive viewer */}
      <style jsx global>{`
        /* Responsive PDF viewer adjustments */
        .rpv-core__viewer {
          height: 100% !important;
        }
        
        /* Mobile optimization */
        @media (max-width: 640px) {
          .rpv-default-layout__toolbar {
            padding: 0.25rem !important;
          }
          
          .rpv-default-layout__toolbar-button {
            padding: 0.25rem !important;
            font-size: 0.875rem !important;
          }
          
          .rpv-default-layout__sidebar {
            width: 200px !important;
          }
        }
        
        /* Tablet optimization */
        @media (min-width: 641px) and (max-width: 1024px) {
          .rpv-default-layout__sidebar {
            width: 250px !important;
          }
        }
        
        /* Desktop optimization */
        @media (min-width: 1025px) {
          .rpv-default-layout__sidebar {
            width: 300px !important;
          }
        }
        
        /* Touch-friendly targets */
        @media (hover: none) and (pointer: coarse) {
          .rpv-default-layout__toolbar-button {
            min-height: 44px !important;
            min-width: 44px !important;
          }
        }
        
        /* Dark Mode Overrides for React PDF Viewer */
        .dark .rpv-core__button {
          color: #e5e7eb !important;
        }
        
        .dark .rpv-core__button:hover {
          background-color: #374151 !important;
        }

        .dark .rpv-core__popover-body {
          background-color: #1f2937 !important;
          color: #e5e7eb !important;
          border-color: #374151 !important;
        }
        
        .dark .rpv-core__popover-body-arrow {
          background-color: #1f2937 !important;
        }
        
        .dark .rpv-core__menu-item {
          color: #e5e7eb !important;
        }
        
        .dark .rpv-core__menu-item:hover {
          background-color: #374151 !important;
        }

        .dark .rpv-core__popover-target {
           color: #e5e7eb !important;
        }

        .dark .rpv-core__textbox {
          color: #e5e7eb !important;
          background-color: #1f2937 !important;
          border-color: #4b5563 !important;
        }

        /* Specifically for the Zoom Text */
        .dark .rpv-zoom__popover-target-scale {
          color: #e5e7eb !important;
        }
        
        /* Bookmarks Dark Mode */
        .dark .rpv-bookmark__title {
          color: #e5e7eb !important;
        }
        
        .dark .rpv-bookmark__item:hover {
          background-color: #374151 !important;
        }
        
        /* Thumbnails Dark Mode */
        .dark .rpv-thumbnail__cover {
          border-color: #4b5563 !important;
        }
        
        .dark .rpv-thumbnail__cover:hover {
          border-color: #60a5fa !important;
        }


        /* Fix transform scale causing blur on some screens */
        .transform-gpu {
          transform: translate3d(0, 0, 0);
        }

        /* 
           CRITICAL DARK MODE FIXES 
           Targeting SVGs and specific elements that were staying dark 
        */
        
        /* Force all icons inside buttons to be light in dark mode */
        /* STRATEGY CHANGE: Use filter instead of fill/stroke to avoid 'blobs' */
        .dark .rpv-core__button,
        .dark .rpv-core__minimal-button {
           color: #e5e7eb !important;
        }

        .dark .rpv-core__button svg,
        .dark .rpv-core__minimal-button svg {
           /* Turn dark icons to white/light gray preserving their shape (stroke vs fill) */
           filter: brightness(0) invert(0.9) !important;
        }
        
        /* The Zoom Dropdown Arrow - handle both directions */
        .dark .rpv-core__popover-target-arrow {
          border-top-color: #e5e7eb !important;
          border-bottom-color: transparent !important;
        }
        
        .dark .rpv-core__popover-target-arrow--up {
          border-bottom-color: #e5e7eb !important;
          border-top-color: transparent !important;
        }

        /* Ensure Textbox background/text is correct */
        .dark .rpv-core__textbox {
          color: #e5e7eb !important;
          background-color: #1f2937 !important;
          border-color: #4b5563 !important;
        }

        /* Ensure Zoom Text is visible */
        .dark .rpv-zoom__popover-target-scale {
          color: #e5e7eb !important;
        }
      `}</style>
    </div>
  );
}
