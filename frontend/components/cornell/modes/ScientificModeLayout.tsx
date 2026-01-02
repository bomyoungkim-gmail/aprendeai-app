/**
 * SCIENTIFIC Mode Layout Component
 * 
 * UI Component - no business logic
 * Following MelhoresPraticas.txt: components for UI only
 * 
 * G5.1: Seções estruturadas (IMRaD)
 * G5.2: Checkpoints por seção
 */

import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BookOpen, CheckCircle2, Lock } from 'lucide-react';
import { Section } from '@/lib/content/section-detector';
import { useTelemetry } from '@/hooks/telemetry/use-telemetry';
import api from '@/services/api';

interface ScientificModeLayoutProps {
  contentId: string;
  children: React.ReactNode;
}

export function ScientificModeLayout({ contentId, children }: ScientificModeLayoutProps) {
  const [currentSection, setCurrentSection] = useState<string | null>(null);
  const [completedSections, setCompletedSections] = useState<Set<string>>(new Set());
  const [showCheckpoint, setShowCheckpoint] = useState(false);
  const [checkpointSection, setCheckpointSection] = useState<Section | null>(null);
  
  const { track } = useTelemetry(contentId);

  // Fetch IMRaD sections
  const { data: sections, isLoading } = useQuery({
    queryKey: ['content-sections', contentId],
    queryFn: async (): Promise<Section[]> => {
      const response = await api.get(`/contents/${contentId}/sections`, {
        params: { mode: 'SCIENTIFIC' }
      });
      return response.data;
    }
  });

  // Track scroll position to detect section changes
  useEffect(() => {
    const handleScroll = () => {
      if (!sections) return;

      const scrollPosition = window.scrollY + window.innerHeight / 2;
      
      for (const section of sections) {
        const element = document.querySelector(`[data-section-id="${section.id}"]`);
        if (!element) continue;

        const rect = element.getBoundingClientRect();
        const sectionTop = rect.top + window.scrollY;
        const sectionBottom = sectionTop + rect.height;

        if (scrollPosition >= sectionTop && scrollPosition <= sectionBottom) {
          if (currentSection !== section.id) {
            setCurrentSection(section.id);
            
            // Track section entry
            track('scientific_section_entered', {
              sectionId: section.id,
              sectionTitle: section.title,
              sectionType: section.type
            });
          }
          break;
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [sections, currentSection, track]);

  // G5.2: Trigger checkpoint when scrolling past section
  useEffect(() => {
    if (!sections || !currentSection) return;

    const currentIndex = sections.findIndex(s => s.id === currentSection);
    if (currentIndex === -1) return;

    // Check if we just finished a section
    const previousSection = sections[currentIndex - 1];
    if (previousSection && !completedSections.has(previousSection.id)) {
      // Trigger checkpoint for previous section
      setCheckpointSection(previousSection);
      setShowCheckpoint(true);
    }
  }, [currentSection, sections, completedSections]);

  const handleCheckpointComplete = (passed: boolean) => {
    if (!checkpointSection) return;

    // Mark section as completed
    setCompletedSections(prev => new Set([...Array.from(prev), checkpointSection.id]));
    
    // Track checkpoint
    track('scientific_checkpoint_completed', {
      sectionId: checkpointSection.id,
      sectionTitle: checkpointSection.title,
      passed,
      timestamp: Date.now()
    });

    setShowCheckpoint(false);
    setCheckpointSection(null);
  };

  const handleSkipCheckpoint = () => {
    if (!checkpointSection) return;

    track('scientific_checkpoint_skipped', {
      sectionId: checkpointSection.id,
      sectionTitle: checkpointSection.title
    });

    setShowCheckpoint(false);
    setCheckpointSection(null);
  };

  // G5.2: Checkpoint Modal
  if (showCheckpoint && checkpointSection) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 max-w-2xl w-full mx-4">
          <div className="flex items-center gap-3 mb-4">
            <Lock className="w-8 h-8 text-blue-600" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
              Checkpoint: {checkpointSection.title}
            </h2>
          </div>

          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Você completou a seção <strong>{checkpointSection.title}</strong>. 
            Responda a pergunta abaixo para continuar.
          </p>

          {/* Placeholder for actual checkpoint question */}
          <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg mb-6">
            <p className="font-medium mb-3">
              Pergunta de compreensão sobre {checkpointSection.title}:
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              [Integração com sistema de assessment pendente]
            </p>
            
            {/* Mock answer options */}
            <div className="space-y-2">
              <button className="w-full text-left px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700">
                Opção A
              </button>
              <button className="w-full text-left px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700">
                Opção B
              </button>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => handleCheckpointComplete(true)}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Responder (Mock: Correto)
            </button>
            <button
              onClick={handleSkipCheckpoint}
              className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
            >
              Pular
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* G5.1: Section Navigation Sidebar */}
      <aside className="fixed left-0 top-20 w-64 h-[calc(100vh-5rem)] overflow-y-auto border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4">
        <div className="flex items-center gap-2 mb-4">
          <BookOpen className="w-5 h-5 text-blue-600" />
          <h3 className="font-bold text-gray-900 dark:text-gray-100">Estrutura IMRaD</h3>
        </div>

        {isLoading && (
          <div className="space-y-2">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-10 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            ))}
          </div>
        )}

        {sections && sections.length > 0 && (
          <nav className="space-y-1">
            {sections.map((section) => {
              const isActive = currentSection === section.id;
              const isCompleted = completedSections.has(section.id);

              return (
                <button
                  key={section.id}
                  onClick={() => {
                    const element = document.querySelector(`[data-section-id="${section.id}"]`);
                    element?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }}
                  className={`w-full text-left px-3 py-2 rounded-lg transition-colors flex items-center justify-between ${
                    isActive
                      ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 font-medium'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                >
                  <span className="text-sm">{section.title}</span>
                  {isCompleted && (
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                  )}
                </button>
              );
            })}
          </nav>
        )}

        {sections && sections.length === 0 && (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Estrutura IMRaD não detectada
          </p>
        )}

        {/* Progress indicator */}
        {sections && sections.length > 0 && (
          <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
            <p className="text-xs text-gray-500 mb-2">Progresso</p>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all"
                  style={{
                    width: `${(completedSections.size / sections.length) * 100}%`
                  }}
                />
              </div>
              <span className="text-xs text-gray-600 dark:text-gray-400">
                {completedSections.size}/{sections.length}
              </span>
            </div>
          </div>
        )}
      </aside>

      {/* Main content with section markers */}
      <div className="ml-64 p-8">
        {children}
      </div>
    </div>
  );
}
