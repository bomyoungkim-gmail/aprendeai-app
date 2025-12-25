'use client';

import React, { useState } from 'react';
import { Viewer, Worker, SpecialZoomLevel } from '@react-pdf-viewer/core';
import { defaultLayoutPlugin } from '@react-pdf-viewer/default-layout';
import { highlightPlugin, Trigger } from '@react-pdf-viewer/highlight';
import { searchPlugin } from '@react-pdf-viewer/search';
import type { RenderHighlightsProps } from '@react-pdf-viewer/highlight';

// Import styles
import '@react-pdf-viewer/core/lib/styles/index.css';
import '@react-pdf-viewer/default-layout/lib/styles/index.css';
import '@react-pdf-viewer/highlight/lib/styles/index.css';

import type { Content, Highlight as BackendHighlight, ViewMode } from '@/lib/types/cornell';
import {
  convertHighlightsToReactPDF,
  reactPDFToBackend,
  getColorForKey,
  type ReactPDFHighlight,
} from '@/lib/adapters/highlight-adapter';

interface PDFViewerProps {
  content: Content;
  mode: ViewMode;
  highlights?: BackendHighlight[];
  onCreateHighlight?: (highlight: any) => Promise<void>;
}

export function PDFViewer({ content, mode, highlights = [], onCreateHighlight }: PDFViewerProps) {
  const [selectedColor, setSelectedColor] = useState<string>('yellow');
  const fileUrl = content.file?.viewUrl;

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
                    background: getColorForKey(selectedColor),
                    opacity: 0.4,
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

  // Highlight plugin setup
  const highlightPluginInstance = highlightPlugin({
    renderHighlights,
    trigger: Trigger.TextSelection,
  });

  const { jumpToHighlightArea } = highlightPluginInstance;

  // Search plugin
  const searchPluginInstance = searchPlugin({
    enableShortcuts: true,
    keyword: '',
  });

  // Default layout with all plugins - responsive configuration
  const defaultLayoutPluginInstance = defaultLayoutPlugin({
    sidebarTabs: (defaultTabs) => [
      defaultTabs[0], // Thumbnails
      defaultTabs[1], // Bookmarks
    ],
    toolbarPlugin: {
      searchPlugin: searchPluginInstance,
    },
  });

  // Handle text selection for creating highlights
  const handleTextSelection = highlightPluginInstance.switchTrigger;

  // Transform and create highlight
  const handleHighlightCreation = async (area: any) => {
    if (!onCreateHighlight) return;

    try {
      const backendFormat = reactPDFToBackend(
        {
          content: { text: area.selectedText || '' },
          position: {
            boundingRect: area.getBoundingClientRect
              ? area.getBoundingClientRect()
              : { x1: 0, y1: 0, x2: 100, y2: 20, width: 100, height: 20, pageIndex: area.pageIndex || 0 },
            rects: [],
            pageIndex: area.pageIndex || 0,
          },
          highlightAreas: [
            {
              left: area.left || 0,
              top: area.top || 0,
              width: area.width || 100,
              height: area.height || 20,
              pageIndex: area.pageIndex || 0,
              height: area.height || 20,
            },
          ],
          comment: { emoji: '💛', message: '' },
        },
        content.id,
        '', // userId will be set by backend
        selectedColor
      );

      await onCreateHighlight(backendFormat);
    } catch (error) {
      console.error('Failed to create highlight:', error);
    }
  };

  if (!fileUrl) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-900">
        <p className="text-gray-500">No PDF file available</p>
      </div>
    );
  }

  return (
    <div className="h-full w-full bg-gray-900 relative">
      {/* Color Picker for Highlights - Responsive */}
      {mode === 'study' && (
        <div className="absolute top-2 right-2 z-50 bg-white rounded-lg shadow-lg p-2 flex flex-wrap gap-2 max-w-xs md:max-w-none">
          <span className="text-xs text-gray-600 self-center font-medium hidden sm:block">
            Highlight:
          </span>
          {['yellow', 'green', 'blue', 'red', 'purple', 'orange'].map((color) => (
            <button
              key={color}
              className={`w-7 h-7 sm:w-8 sm:h-8 rounded-md border-2 transition-all ${
                selectedColor === color ? 'border-gray-800 scale-110' : 'border-gray-300 hover:border-gray-500'
              }`}
              style={{ backgroundColor: getColorForKey(color) }}
              onClick={() => setSelectedColor(color)}
              title={color.charAt(0).toUpperCase() + color.slice(1)}
              aria-label={`Select ${color} highlight color`}
            />
          ))}
        </div>
      )}

      {/* PDF Viewer with Worker - Responsive */}
      <Worker workerUrl="https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js">
        <div className="h-full w-full">
          <Viewer
            fileUrl={fileUrl}
            plugins={[defaultLayoutPluginInstance, highlightPluginInstance, searchPluginInstance]}
            defaultScale={SpecialZoomLevel.PageFit}
            theme={{
              theme: 'dark',
            }}
            renderLoader={(percentages: number) => (
              <div className="flex items-center justify-center h-full bg-gray-900">
                <div className="text-center px-4">
                  <div className="animate-spin rounded-full h-12 w-12 sm:h-16 sm:w-16 border-b-2 border-white mx-auto mb-4"></div>
                  <p className="text-white text-sm sm:text-base">
                    Loading PDF... {Math.round(percentages)}%
                  </p>
                </div>
              </div>
            )}
            renderError={(error: any) => (
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
                    {error?.message || 'Unknown error'}
                  </p>
                  <p className="text-xs text-gray-500">
                    Please check your internet connection and try again
                  </p>
                </div>
              </div>
            )}
          />
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
      `}</style>
    </div>
  );
}
