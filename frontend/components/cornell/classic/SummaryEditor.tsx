import React from 'react';

interface SummaryEditorProps {
  summary: string;
  onChange: (summary: string) => void;
}

export function SummaryEditor({ summary, onChange }: SummaryEditorProps) {
  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <h2 className="text-lg font-semibold text-gray-900 mb-3">Summary</h2>

      {/* Summary Textarea */}
      <textarea
        value={summary}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Summarize the main ideas in your own words..."
        className="flex-1 w-full p-4 text-sm text-gray-900 bg-yellow-50 border border-yellow-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-yellow-400 placeholder:text-gray-400"
      />

      {/* Character Count */}
      <div className="mt-2 text-right">
        <span className="text-xs text-gray-500">
          {summary.length} character{summary.length !== 1 ? 's' : ''}
        </span>
      </div>
    </div>
  );
}
