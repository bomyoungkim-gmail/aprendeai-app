'use client';

import { useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useAutoTrackReading } from '@/hooks/use-auto-track';

export default function ReaderPage() {
  const params = useParams();
  const contentId = params.id as string;

  // Auto-track reading activity every 30 seconds
  useAutoTrackReading(contentId);

  return (
    <div className="min-h-screen">
      {/* Your existing reader component */}
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-4">Reading Content</h1>
        {/* Content goes here */}
      </div>
    </div>
  );
}
