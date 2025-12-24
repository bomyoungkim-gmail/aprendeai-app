'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';

export default function SettingsPage() {
  const [contentFilters, setContentFilters] = useState({
    minAge: 6,
    maxAge: 18,
  });
  const [screenTimeLimit, setScreenTimeLimit] = useState(120); // minutes

  const handleSave = () => {
    // TODO: Save to backend
    toast.success('Settings saved successfully!');
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Family Settings</h1>
      
      {/* Content Filters */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 mb-6">
        <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Content Filters</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Control what content is appropriate for your family
        </p>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Minimum Age: {contentFilters.minAge}
            </label>
            <input
              type="range"
              min="3"
              max="18"
              value={contentFilters.minAge}
              onChange={(e) => setContentFilters({ ...contentFilters, minAge: parseInt(e.target.value) })}
              className="w-full"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Maximum Age: {contentFilters.maxAge}
            </label>
            <input
              type="range"
              min="3"
              max="18"
              value={contentFilters.maxAge}
              onChange={(e) => setContentFilters({ ...contentFilters, maxAge: parseInt(e.target.value) })}
              className="w-full"
            />
          </div>
        </div>
      </div>

      {/* Screen Time Limits */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 mb-6">
        <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Screen Time Limits</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Set daily screen time limits (optional)
        </p>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Daily Limit: {screenTimeLimit} minutes
          </label>
          <input
            type="range"
            min="30"
            max="300"
            step="30"
            value={screenTimeLimit}
            onChange={(e) => setScreenTimeLimit(parseInt(e.target.value))}
            className="w-full"
          />
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500"
        >
          Save Settings
        </button>
      </div>
    </div>
  );
}
