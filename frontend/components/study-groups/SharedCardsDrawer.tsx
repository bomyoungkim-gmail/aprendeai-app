'use client';

import { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { SharedCard } from '@/lib/types/study-groups';
import { X } from 'lucide-react';

interface SharedCardsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  sharedCards: SharedCard[];
}

export function SharedCardsDrawer({ isOpen, onClose, sharedCards }: SharedCardsDrawerProps) {
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

        <div className="fixed inset-0 overflow-hidden">
          <div className="absolute inset-0 overflow-hidden">
            <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
              <Transition.Child
                as={Fragment}
                enter="transform transition ease-in-out duration-300"
                enterFrom="translate-x-full"
                enterTo="translate-x-0"
                leave="transform transition ease-in-out duration-300"
                leaveFrom="translate-x-0"
                leaveTo="translate-x-full"
              >
                <Dialog.Panel className="pointer-events-auto w-screen max-w-md">
                  <div className="flex h-full flex-col bg-white shadow-xl">
                    <div className="flex items-center justify-between border-b px-6 py-4">
                      <Dialog.Title className="text-lg font-semibold">
                        Shared Cards ({sharedCards.length})
                      </Dialog.Title>
                      <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 space-y-6">
                      {sharedCards.length === 0 && (
                        <div className="text-center text-gray-600 py-12">
                          No shared cards yet. Complete rounds to generate cards.
                        </div>
                      )}

                      {sharedCards.map((card) => (
                        <div
                          key={card.id}
                          className="border border-gray-200 rounded-lg p-4 space-y-3"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-600">
                              Round {card.round?.roundIndex}
                            </span>
                            <span className={`text-xs px-2 py-1 rounded ${
                              card.round?.status === 'DONE' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {card.round?.status}
                            </span>
                          </div>

                          <div>
                            <div className="text-sm font-medium text-gray-700 mb-1">Prompt:</div>
                            <div className="text-sm text-gray-600">{card.cardJson.prompt}</div>
                          </div>

                          <div>
                            <div className="text-sm font-medium text-gray-700 mb-1">Group Answer:</div>
                            <div className="text-sm font-semibold text-blue-700">
                              {card.cardJson.groupAnswer}
                            </div>
                          </div>

                          <div>
                            <div className="text-sm font-medium text-gray-700 mb-1">Explanation:</div>
                            <div className="text-sm text-gray-600">{card.cardJson.explanation}</div>
                          </div>

                          {card.cardJson.keyTerms && card.cardJson.keyTerms.length > 0 && (
                            <div>
                              <div className="text-sm font-medium text-gray-700 mb-1">Key Terms:</div>
                              <div className="flex flex-wrap gap-2">
                                {card.cardJson.keyTerms.map((term, idx) => (
                                  <span
                                    key={idx}
                                    className="text-xs px-2 py-1 bg-purple-100 text-purple-800 rounded"
                                  >
                                    {term}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          {card.cardJson.linkedHighlightIds && card.cardJson.linkedHighlightIds.length > 0 && (
                            <div className="text-xs text-gray-500">
                              {card.cardJson.linkedHighlightIds.length} linked highlight(s)
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
