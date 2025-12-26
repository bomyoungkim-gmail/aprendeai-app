import React, { useRef, useState, useEffect } from 'react';
import { ReadingProgressBar } from './ReadingProgressBar';

export type ReaderTheme = 'sepia' | 'light' | 'dark';

interface EducationalPDFViewerProps {
  children: React.ReactNode;
  theme?: ReaderTheme;
  showProgressBar?: boolean;
}

export function EducationalPDFViewer({ 
  children, 
  theme = 'sepia',
  showProgressBar = true 
}: EducationalPDFViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollProgress, setScrollProgress] = useState(0);

  // Theme Styles Configuration
  const themeStyles: Record<ReaderTheme, string> = {
    sepia: 'bg-amber-50 text-gray-900',
    light: 'bg-white text-gray-900',
    dark: 'bg-gray-900 text-gray-100',
  };

  // Handle Scroll Progress
  const handleScroll = () => {
    if (!containerRef.current) return;

    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    
    // Calculate progress percentage
    // If content fits in screen, progress is 100%
    const totalScrollable = scrollHeight - clientHeight;
    const progress = totalScrollable > 0 
      ? (scrollTop / totalScrollable) * 100 
      : 100;
      
    setScrollProgress(progress);
  };

  // Add scroll listener
  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      // Initial check
      handleScroll();
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, [children]);

  return (
    <div className="relative flex flex-col h-full w-full overflow-hidden">
      {/* Progress Bar (Fixed at top of viewer area) */}
      {showProgressBar && (
        <div className="absolute top-0 left-0 right-0 z-20">
          <ReadingProgressBar progress={scrollProgress} className="!static" />
        </div>
      )}

      {/* Main Content Area */}
      <div 
        ref={containerRef}
        className={`flex-1 overflow-auto transition-colors duration-300 ${themeStyles[theme]} p-4 sm:p-8 md:p-12`}
        data-testid="educational-viewer-content"
      >
        <div className="max-w-4xl mx-auto min-h-full shadow-sm bg-white/50 dark:bg-black/20 backdrop-blur-sm rounded-xl p-6 sm:p-10">
          {children}
        </div>
      </div>
    </div>
  );
}
