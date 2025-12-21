'use client';

import { useState, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { useCreateFamily } from '@/hooks/use-family';
import { useRouter } from 'next/navigation';
import { X, Loader2 } from 'lucide-react';
import { ROUTES } from '@/lib/config/routes';

interface CreateFamilyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreateFamilyModal({ isOpen, onClose }: CreateFamilyModalProps) {
  const router = useRouter();
  const [name, setName] = useState('');
  const createFamily = useCreateFamily();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const family = await createFamily.mutateAsync({ name });
      setName('');
      
      // Navigate to the newly created family's dashboard
      // (Backend now auto-sets this as Primary Family)
      router.push(ROUTES.FAMILY.DETAIL(family.id));
      
      // Small delay to ensure navigation starts before closing modal
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Close modal after navigation is initiated
      onClose();
    } catch (error) {
      console.error('Failed to create family:', error);
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
                  Create New Family
                </Dialog.Title>
                <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="mb-4">
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                    Family Name
                  </label>
                  <input
                    id="name"
                    data-testid="family-name-input"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g. The Smiths"
                  />
                  <p className="mt-1 text-sm text-gray-500">
                    This will be the name displayed on your dashboard.
                  </p>
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
                    data-testid="submit-family-btn"
                    disabled={createFamily.isPending}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                  >
                    {createFamily.isPending ? 'Creating...' : 'Create Family'}
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
