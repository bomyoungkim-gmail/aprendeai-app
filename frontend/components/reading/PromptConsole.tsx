'use client';

import { useState } from 'react';
import { useSession } from '@/contexts/SessionContext';
import { ChatHistory } from './ChatHistory';
import { QuickReplies } from './QuickReplies';
import { PromptInput } from './PromptInput';
import { ShortcutsMenu } from './ShortcutsMenu';
import { PolicyIndicatorCompact } from './PolicyIndicator';
import './prompt-console.css';


interface PromptConsoleProps {
  sessionId: string;
  onComplete?: () => void;
}

/**
 * PromptConsole - Main prompt-only interface component
 * 
 * Uses existing SessionContext (extended in Phase 3)
 * No duplicate state management!
 */
export function PromptConsole({ sessionId, onComplete }: PromptConsoleProps) {
  // REUSE existing SessionContext!
  const { messages, quickReplies, sendPrompt, isLoading } = useSession();
  
  const [inputValue, setInputValue] = useState('');
  const [showShortcuts, setShowShortcuts] = useState(false);

  const handleSend = async () => {
    if (!inputValue.trim() || isLoading) return;
    
    await sendPrompt(inputValue);
    setInputValue('');
  };

  const handleQuickReplySelect = async (reply: string) => {
    await sendPrompt(reply);
  };

  const handleShortcutSelect = (shortcut: string) => {
    setInputValue(prev => prev + shortcut);
    setShowShortcuts(false);
  };

  return (
    <div className="prompt-console" data-testid="prompt-console">
      <div className="prompt-console-header">
        <h2>Conversa com o Educador</h2>
        <div className="flex items-center gap-3">
          <PolicyIndicatorCompact policy={undefined} /> {/* TODO: Get from session */}
          
          {/* 
            TODO: FUTURE POLICY IMPLEMENTATIONS
            Ref: Script 06 - Policy Frontend Awareness
            
            The following buttons should be implemented/wrapped with PolicyAwareFeature:
            
            1. [ ] OCR Button -> Check 'allowOcr'
            2. [ ] Summarize All -> Check 'allowTextExtraction'
            3. [ ] Sentence Analysis -> Check 'isSentenceAnalysisEnabled'
            4. [ ] Mission Feedback -> Check 'isMissionFeedbackEnabled'
            5. [ ] Hugging/Generality -> Check 'isHuggingEnabled'
            
            Example:
            <PolicyAwareFeature featureGate="ocr" policy={session?.decision_policy}>
              <OcrButton />
            </PolicyAwareFeature>
          */}
          
          <button
            onClick={() => setShowShortcuts(!showShortcuts)}
            className="shortcuts-toggle"
            aria-label="Atalhos de comando"
          >
            <span>💡</span>
          </button>
        </div>
      </div>

      {showShortcuts && (
        <ShortcutsMenu
          onSelect={handleShortcutSelect}
          onClose={() => setShowShortcuts(false)}
        />
      )}

      <ChatHistory messages={messages} isLoading={isLoading} data-testid="messages-container" />

      {quickReplies.length > 0 && (
        <QuickReplies
          replies={quickReplies}
          onSelect={handleQuickReplySelect}
          disabled={isLoading}
        />
      )}

      <PromptInput
        value={inputValue}
        onChange={setInputValue}
        onSend={handleSend}
        isLoading={isLoading}
        placeholder="Digite sua mensagem ou use /mark, /checkpoint..."
      />
    </div>
  );
}
