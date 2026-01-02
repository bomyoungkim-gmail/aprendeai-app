/**
 * PDFStyles - Estilos globais para o PDF Viewer
 * 
 * Inclui:
 * - Responsive adjustments
 * - Dark mode overrides
 * - Touch-friendly targets
 * - Custom scrollbar
 */
export function PDFStyles() {
  return (
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
  );
}
