'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function ExtensionVerify() {
  const [userCode, setUserCode] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleApprove = async (approve: boolean) => {
    if (!userCode.trim()) {
      setStatus('Please enter a code');
      return;
    }

    setLoading(true);
    setStatus('Processing...');

    try {
      const response = await fetch('/api/v1/auth/extension/device/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          userCode: userCode.toUpperCase(),
          approve,
        }),
      });

      if (response.ok) {
        setStatus(approve ? '✅ Extension authorized!' : '❌ Authorization denied');
        
        if (approve) {
          setTimeout(() => {
            setStatus('You can close this tab now.');
          }, 2000);
        }
      } else {
        const error = await response.json();
        setStatus(`Error: ${error.message || 'Invalid code'}`);
      }
    } catch (error) {
      setStatus(`Error: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">🔐</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Authorize Browser Extension
          </h1>
          <p className="text-gray-600">
            Enter the code shown in your browser extension
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label htmlFor="userCode" className="block text-sm font-medium text-gray-700 mb-2">
              Authorization Code
            </label>
            <input
              id="userCode"
              type="text"
              value={userCode}
              onChange={(e) => setUserCode(e.target.value.toUpperCase())}
              placeholder="ABCD-1234"
              maxLength={9}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-center text-xl font-mono tracking-widest focus:ring-2 focus:ring-indigo-500 focus:border-transparent uppercase"
              disabled={loading}
            />
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => handleApprove(false)}
              disabled={loading || !userCode.trim()}
              className="flex-1 py-3 px-4 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              ❌ Deny
            </button>
            <button
              onClick={() => handleApprove(true)}
              disabled={loading || !userCode.trim()}
              className="flex-1 py-3 px-4 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              ✅ Authorize
            </button>
          </div>

          {status && (
            <div className={`p-4 rounded-lg text-center ${
              status.includes('✅') ? 'bg-green-50 text-green-800' :
              status.includes('❌') ? 'bg-red-50 text-red-800' :
              'bg-blue-50 text-blue-800'
            }`}>
              {status}
            </div>
          )}
        </div>

        <div className="mt-8 pt-6 border-t border-gray-200">
          <p className="text-xs text-gray-500 text-center">
            This code expires in 10 minutes. Make sure you authorized the extension install before entering the code.
          </p>
        </div>
      </div>
    </div>
  );
}
