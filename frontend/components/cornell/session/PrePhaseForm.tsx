'use client';

import { useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';

interface PrePhaseFormProps {
  isOpen: boolean;
  minTargetWords: number;
  onSubmit: (data: {
    goalStatement: string;
    predictionText: string;
    targetWordsJson: string[];
  }) => Promise<void>;
  onClose?: () => void;
}

export function PrePhaseForm({
  isOpen,
  minTargetWords,
  onSubmit,
  onClose,
}: PrePhaseFormProps) {
  const [goalStatement, setGoalStatement] = useState('');
  const [predictionText, setPredictionText] = useState('');
  const [targetWords, setTargetWords] = useState<string[]>(['', '', '']);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Initialize with minimum required words
  useEffect(() => {
    const initialWords = Array(Math.max(minTargetWords, 3)).fill('');
    setTargetWords(initialWords);
  }, [minTargetWords]);

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (goalStatement.trim().length < 10) {
      newErrors.goalStatement = 'Goal statement must be at least 10 characters';
    }

    if (predictionText.trim().length < 10) {
      newErrors.predictionText = 'Prediction must be at least 10 characters';
    }

    const filledWords = targetWords.filter(w => w.trim().length > 0);
    if (filledWords.length < minTargetWords) {
      newErrors.targetWords = `You need at least ${minTargetWords} target words`;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    try {
      setIsSubmitting(true);
      const filledWords = targetWords.filter(w => w.trim().length > 0);
      
      await onSubmit({
        goalStatement: goalStatement.trim(),
        predictionText: predictionText.trim(),
        targetWordsJson: filledWords,
      });
    } catch (error) {
      console.error('Failed to submit pre-phase:', error);
      setErrors({
        submit: error instanceof Error ? error.message : 'Failed to start reading session',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleWordChange = (index: number, value: string) => {
    const newWords = [...targetWords];
    newWords[index] = value;
    setTargetWords(newWords);
    
    // Clear error when user types
    if (errors.targetWords) {
      setErrors({ ...errors, targetWords: '' });
    }
  };

  const addWordField = () => {
    setTargetWords([...targetWords, '']);
  };

  const removeWordField = (index: number) => {
    if (targetWords.length > minTargetWords) {
      const newWords = targetWords.filter((_, i) => i !== index);
      setTargetWords(newWords);
    }
  };

  const filledWordsCount = targetWords.filter(w => w.trim().length > 0).length;

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={() => {}}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white p-8 text-left align-middle shadow-xl transition-all">
                <Dialog.Title
                  as="h3"
                  className="text-2xl font-bold leading-6 text-gray-900 mb-2"
                >
                  Before You Start Reading...
                </Dialog.Title>
                
                <p className="text-sm text-gray-600 mb-6">
                  Take a moment to set your learning goals and predictions. This helps activate your prior knowledge.
                </p>

                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Goal Statement */}
                  <div>
                    <label
                      htmlFor="goal"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      📝 What's your goal for this reading?
                      <span className="text-red-500 ml-1">*</span>
                    </label>
                    <textarea
                      id="goal"
                      rows={3}
                      value={goalStatement}
                      onChange={(e) => {
                        setGoalStatement(e.target.value);
                        if (errors.goalStatement) {
                          setErrors({ ...errors, goalStatement: '' });
                        }
                      }}
                      className={`w-full rounded-lg border ${
                        errors.goalStatement ? 'border-red-300' : 'border-gray-300'
                      } px-4 py-3 focus:border-blue-500 focus:ring-blue-500`}
                      placeholder="Example: I want to understand the basic concepts of quantum physics..."
                    />
                    {errors.goalStatement && (
                      <p className="mt-1 text-sm text-red-600">{errors.goalStatement}</p>
                    )}
                    <p className="mt-1 text-xs text-gray-500">
                      {goalStatement.length}/10 characters minimum
                    </p>
                  </div>

                  {/* Prediction */}
                  <div>
                    <label
                      htmlFor="prediction"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      🔮 What do you predict this content will cover?
                      <span className="text-red-500 ml-1">*</span>
                    </label>
                    <textarea
                      id="prediction"
                      rows={3}
                      value={predictionText}
                      onChange={(e) => {
                        setPredictionText(e.target.value);
                        if (errors.predictionText) {
                          setErrors({ ...errors, predictionText: '' });
                        }
                      }}
                      className={`w-full rounded-lg border ${
                        errors.predictionText ? 'border-red-300' : 'border-gray-300'
                      } px-4 py-3 focus:border-blue-500 focus:ring-blue-500`}
                      placeholder="Example: I think it will explain wave-particle duality and quantum states..."
                    />
                    {errors.predictionText && (
                      <p className="mt-1 text-sm text-red-600">{errors.predictionText}</p>
                    )}
                    <p className="mt-1 text-xs text-gray-500">
                      {predictionText.length}/10 characters minimum
                    </p>
                  </div>

                  {/* Target Words */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      🎯 Target words to look for (minimum {minTargetWords})
                      <span className="text-red-500 ml-1">*</span>
                    </label>
                    <div className="space-y-2">
                      {targetWords.map((word, index) => (
                        <div key={index} className="flex items-center space-x-2">
                          <input
                            type="text"
                            value={word}
                            onChange={(e) => handleWordChange(index, e.target.value)}
                            className="flex-1 rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:ring-blue-500"
                            placeholder={`Word ${index + 1}${
                              index < minTargetWords ? ' (required)' : ' (optional)'
                            }`}
                          />
                          {index >= minTargetWords && (
                            <button
                              type="button"
                              onClick={() => removeWordField(index)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                            >
                              <svg
                                className="h-5 w-5"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M6 18L18 6M6 6l12 12"
                                />
                              </svg>
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                    
                    {errors.targetWords && (
                      <p className="mt-2 text-sm text-red-600">{errors.targetWords}</p>
                    )}
                    
                    <div className="mt-3 flex items-center justify-between">
                      <button
                        type="button"
                        onClick={addWordField}
                        className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center"
                      >
                        <svg
                          className="h-4 w-4 mr-1"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                          />
                        </svg>
                        Add another word
                      </button>
                      <p className="text-xs text-gray-500">
                        {filledWordsCount}/{minTargetWords} required words
                      </p>
                    </div>
                  </div>

                  {/* Submit Error */}
                  {errors.submit && (
                    <div className="rounded-lg bg-red-50 p-4">
                      <p className="text-sm text-red-800">{errors.submit}</p>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex justify-end space-x-3 pt-4 border-t">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {isSubmitting ? (
                        <>
                          <svg
                            className="animate-spin -ml-1 mr-2 h-5 w-5 text-white"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            />
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            />
                          </svg>
                          Starting...
                        </>
                      ) : (
                        <>
                          Start Reading
                          <svg
                            className="ml-2 -mr-1 h-5 w-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M13 7l5 5m0 0l-5 5m5-5H6"
                            />
                          </svg>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
