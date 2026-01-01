/**
 * Cornell Analytics Tab Component
 * 
 * Displays analytics dashboard for reading session.
 */

import React from 'react';
import { AnalyticsDashboard } from '../../analytics/AnalyticsDashboard';

export interface CornellAnalyticsTabProps {
  contentId: string;
}

export function CornellAnalyticsTab({
  contentId,
}: CornellAnalyticsTabProps) {
  return (
    <div className="p-4">
      <AnalyticsDashboard contentId={contentId} />
    </div>
  );
}
