import React from 'react';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UpgradeModal = ({ isOpen, onClose }: UpgradeModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-lg p-6 w-96 shadow-xl">
        <h2 className="text-xl font-bold mb-4">Upgrade Plan</h2>
        <p className="text-gray-600 mb-6">
          Upgrade functionality coming soon! You will be able to unlock premium features.
          {/* TODO(github): Replace this placeholder with Stripe checkout integration */}
        </p>
        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 text-white rounded hover:bg-slate-800"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
