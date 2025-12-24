'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';
import { API_BASE_URL } from '@/lib/config/api';

interface ClassificationSuggestion {
  ageMin: number;
  ageMax: number;
  contentRating: string;
  complexity: string;
  topics: string[];
  confidence: number;
}

export default function ContentClassificationPanel({
  contentId,
  title,
  description,
  currentClassification,
  onSave,
}: {
  contentId: string;
  title: string;
  description?: string;
  currentClassification?: any;
  onSave: (classification: any) => void;
}) {
  const [suggestion, setSuggestion] = useState<ClassificationSuggestion | null>(null);
  const [classification, setClassification] = useState({
    ageMin: currentClassification?.ageMin || 6,
    ageMax: currentClassification?.ageMax || 12,
    complexity: currentClassification?.complexity || 'INTERMEDIATE',
  });
  const [loading, setLoading] = useState(false);

  const getToken = () => localStorage.getItem('token');

  const getSuggestion = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/content-classification/suggest/${contentId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${getToken()}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title, description }),
      });

      if (res.ok) {
        const data = await res.json();
        setSuggestion(data.suggested);
        toast.success('AI suggestion generated!');
      } else {
        toast.error('Failed to get AI suggestion');
      }
    } catch (error) {
      console.error(error);
      toast.error('Network error');
    } finally {
      setLoading(false);
    }
  };

  const applySuggestion = () => {
    if (suggestion) {
      setClassification({
        ageMin: suggestion.ageMin,
        ageMax: suggestion.ageMax,
        complexity: suggestion.complexity,
      });
      toast.success('AI suggestion applied');
    }
  };

  const handleSave = () => {
    onSave(classification);
    toast.success('Classification saved!');
  };

  return (
    <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">Content Age Classification</h3>
        <button
          onClick={getSuggestion}
          disabled={loading}
          className="rounded-md bg-purple-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-purple-500 disabled:opacity-50"
        >
          {loading ? 'Analyzing...' : '🤖 Get AI Suggestion'}
        </button>
      </div>

      {/* AI Suggestion */}
      {suggestion && (
        <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-700 rounded-md p-4 mb-4">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-purple-900 dark:text-purple-100">AI Recommendation</p>
              <p className="text-sm text-purple-700 dark:text-purple-300 mt-1">
                Age: {suggestion.ageMin}-{suggestion.ageMax} | Level: {suggestion.complexity} | Rating: {suggestion.contentRating}
              </p>
              <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">
                Confidence: {Math.round(suggestion.confidence * 100)}%
              </p>
              {suggestion.topics.length > 0 && (
                <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">
                  Topics: {suggestion.topics.join(', ')}
                </p>
              )}
            </div>
            <button
              onClick={applySuggestion}
              className="rounded-md bg-purple-600 px-3 py-1 text-xs font-semibold text-white hover:bg-purple-500"
            >
              Apply
            </button>
          </div>
        </div>
      )}

      {/* Manual Classification */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Minimum Age: {classification.ageMin}
          </label>
          <input
            type="range"
            min="3"
            max="18"
            value={classification.ageMin}
            onChange={(e) => setClassification({ ...classification, ageMin: parseInt(e.target.value) })}
            className="w-full"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Maximum Age: {classification.ageMax}
          </label>
          <input
            type="range"
            min="3"
            max="18"
            value={classification.ageMax}
            onChange={(e) => setClassification({ ...classification, ageMax: parseInt(e.target.value) })}
            className="w-full"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Complexity</label>
          <select
            value={classification.complexity}
            onChange={(e) => setClassification({ ...classification, complexity: e.target.value })}
            className="w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm px-3 py-2 border"
          >
            <option value="BASIC">Basic</option>
            <option value="INTERMEDIATE">Intermediate</option>
            <option value="ADVANCED">Advanced</option>
          </select>
        </div>
      </div>

      <div className="mt-6 flex justify-end">
        <button
          onClick={handleSave}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500"
        >
          Save Classification
        </button>
      </div>
    </div>
  );
}
