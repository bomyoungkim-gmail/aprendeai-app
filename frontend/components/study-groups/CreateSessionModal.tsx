'use client';

import { useState, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { useCreateSession } from '@/hooks/sessions/group/use-sessions';
import { GroupContent } from '@/lib/types/study-groups';
import { X } from 'lucide-react';

interface CreateSessionModalProps {
  groupId: string;
  contents: GroupContent[];
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (sessionId: string) => void;
}

export function CreateSessionModal({ groupId, contents, isOpen, onClose, onSuccess }: CreateSessionModalProps) {
  const [contentId, setContentId] = useState('');
  const [layer, setLayer] = useState('L1');
  const [roundsCount, setRoundsCount] = useState(3);
  const createSession = useCreateSession();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const session = await createSession.mutateAsync({
        groupId,
        dto: {
          contentId,
          mode: 'PI_SPRINT',
          layer,
          roundsCount,
        },
      });
      
      setContentId('');
      setLayer('L1');
      setRoundsCount(3);
      onClose();
      
      if (onSuccess && session.id) {
        onSuccess(session.id);
      }
    } catch (error) {
      console.error('Failed to create session:', error);
    }
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/30" />
        </Transition.Child>

        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0 scale-95"
            enterTo="opacity-100 scale-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100 scale-100"
            leaveTo="opacity-0 scale-95"
          >
            <Dialog.Panel className="bg-white rounded-lg p-6 max-w-md w-full">
              <div className="flex justify-between items-center mb-4">
                <Dialog.Title className="text-xl font-semibold">
                  Start PI Sprint Session
                </Dialog.Title>
                <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="mb-4">
                  <label htmlFor="contentId" className="block text-sm font-medium text-gray-700 mb-2">
                    Content
                  </label>
                  <select
                    id="contentId"
                    value={contentId}
                    onChange={(e) => setContentId(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select content</option>
                    {contents.map((item) => (
                      <option key={item.contentId} value={item.contentId}>
                        {item.content?.title || item.contentId}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="mb-4">
                  <label htmlFor="layer" className="block text-sm font-medium text-gray-700 mb-2">
                    Layer
                  </label>
                  <select
                    id="layer"
                    value={layer}
                    onChange={(e) => setLayer(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="L1">L1 (Basic)</option>
                    <option value="L2">L2 (Intermediate)</option>
                    <option value="L3">L3 (Advanced)</option>
                  </select>
                </div>

                <div className="mb-4">
                  <label htmlFor="roundsCount" className="block text-sm font-medium text-gray-700 mb-2">
                    Number of Rounds
                  </label>
                  <input
                    id="roundsCount"
                    type="number"
                    min="1"
                    max="10"
                    value={roundsCount}
                    onChange={(e) => setRoundsCount(parseInt(e.target.value))}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={createSession.isPending}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                  >
                    {createSession.isPending ? 'Creating...' : 'Start Session'}
                  </button>
                </div>
              </form>
            </Dialog.Panel>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition>
  );
}
