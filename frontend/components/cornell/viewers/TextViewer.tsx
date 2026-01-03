'use client';

import React from 'react';
import { Content } from '@/lib/types/cornell';

interface TextViewerProps {
  content: Content;
}

export function TextViewer({ content }: TextViewerProps) {
  return (
    <div className="h-full overflow-auto bg-white dark:bg-gray-900 p-8 custom-scrollbar">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-gray-900 dark:text-gray-100">
          {content.title}
        </h1>
        <div className="prose dark:prose-invert prose-blue max-w-none">
          {content.text ? (
            <div className="space-y-4">
              {content.text
                .split('\n')
                .filter((line: string) => line.trim()) // Filter empty lines first
                .map((line: string, i: number) => (
                  <p key={i} className="mb-4 text-gray-700 dark:text-gray-300 leading-relaxed">
                    {line}
                  </p>
                ))}
            </div>
          ) : (
            <p className="text-gray-500 italic">Nenhum conteúdo de texto disponível.</p>
          )}
        </div>
      </div>
    </div>
  );
}
