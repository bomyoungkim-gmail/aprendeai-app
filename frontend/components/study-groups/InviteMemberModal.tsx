'use client';

import { useState, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { useInviteMember } from '@/hooks/use-groups';
import { X } from 'lucide-react';

interface InviteMemberModalProps {
  groupId: string;
  isOpen: boolean;
  onClose: () => void;
}

export function InviteMemberModal({ groupId, isOpen, onClose }: InviteMemberModalProps) {
  const [userId, setUserId] = useState('');
  const [role, setRole] = useState<'MEMBER' | 'MOD'>('MEMBER');
  const inviteMember = useInviteMember(groupId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await inviteMember.mutateAsync({ userId, role });
      setUserId('');
      setRole('MEMBER');
      onClose();
    } catch (error) {
      console.error('Failed to invite member:', error);
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
                  Invite Member
                </Dialog.Title>
                <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="mb-4">
                  <label htmlFor="userId" className="block text-sm font-medium text-gray-700 mb-2">
                    User ID
                  </label>
                  <input
                    id="userId"
                    type="text"
                    value={userId}
                    onChange={(e) => setUserId(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter user ID"
                  />
                </div>

                <div className="mb-4">
                  <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-2">
                    Role
                  </label>
                  <select
                    id="role"
                    value={role}
                    onChange={(e) => setRole(e.target.value as 'MEMBER' | 'MOD')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="MEMBER">Member</option>
                    <option value="MOD">Moderator</option>
                  </select>
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
                    disabled={inviteMember.isPending}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                  >
                    {inviteMember.isPending ? 'Inviting...' : 'Invite'}
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
