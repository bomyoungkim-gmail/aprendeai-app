/**
 * Cornell TOC Tab Component
 * 
 * Displays table of contents for the document.
 */

import React from 'react';
import { TableOfContents } from '../TableOfContents';

export interface CornellTocTabProps {
  contentId: string;
  currentPage?: number;
  onNavigate: (page: number, id: string) => void;
}

export function CornellTocTab({
  contentId,
  currentPage,
  onNavigate,
}: CornellTocTabProps) {
  return (
    <TableOfContents 
      contentId={contentId}
      currentPage={currentPage}
      onNavigate={onNavigate}
    />
  );
}
