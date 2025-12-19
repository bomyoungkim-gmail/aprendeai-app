'use client';

import { useState, useEffect } from 'react';
import { GroupSession, GroupRound } from '@/lib/types/study-groups';
import { useSubmitEvent, useSessionEvents } from '@/hooks/use-sessions';
import { useAuthStore } from '@/stores/auth-store';
import { AlertCircle, ChevronRight } from 'lucide-react';

interface RoundPanelProps {
  session: GroupSession;
  currentRound: GroupRound | null;
  myRole: string | null;
  canAdvance: boolean;
  selectedHighlightIds: string[];
  onAdvance: (toStatus: string) => Promise<void>;
}

export function RoundPanel({ session, currentRound, myRole, canAdvance, selectedHighlightIds, onAdvance }: RoundPanelProps) {
  const { user } = useAuthStore();
  const submitEvent = useSubmitEvent(session.id);
  const { data: events } = useSessionEvents(session.id, currentRound?.roundIndex);
  
  const [voteChoice, setVoteChoice] = useState('');
  const [voteRationale, setVoteRationale] = useState('');
 const [hasVoted, setHasVoted] = useState(false);
  const [hasRevoted, setHasRevoted] = useState(false);
  
  const [explanation, setExplanation] = useState('');
  const [groupChoice, setGroupChoice] = useState('');
  const [keyTerms, setKeyTerms] = useState('');

  useEffect(() => {
    if (!events || !currentRound) return;
    
    const myVote = events.find(e => e.eventType === 'PI_VOTE_SUBMIT' && e.userId === user?.id);
    const myRevote = events.find(e => e.eventType === 'PI_REVOTE_SUBMIT' && e.userId === user?.id);
    
    setHasVoted(!!myVote);
    setHasRevoted(!!myRevote);
  }, [events, user?.id, currentRound]);

  if (!currentRound) {
    return (
      <div className="bg-white rounded-lg shadow p-6 text-center text-gray-600">
        No round available
      </div>
    );
  }

  const handleVoteSubmit = async () => {
    if (!voteChoice) return;
    
    try {
      await submitEvent.mutateAsync({
        roundIndex: currentRound.roundIndex,
        eventType: 'PI_VOTE_SUBMIT',
        payload: { choice: voteChoice, rationale: voteRationale },
      });
      setHasVoted(true);
    } catch (error) {
      console.error('Failed to submit vote:', error);
    }
  };

  const handleRevoteSubmit = async () => {
    if (!voteChoice) return;
    
    try {
      await submitEvent.mutateAsync({
        roundIndex: currentRound.roundIndex,
        eventType: 'PI_REVOTE_SUBMIT',
        payload: { choice: voteChoice, rationale: voteRationale },
      });
      setHasRevoted(true);
    } catch (error) {
      console.error('Failed to submit revote:', error);
    }
  };

  const handleExplanationSubmit = async () => {
    if (!groupChoice || !explanation) return;
    
    try {
      await submitEvent.mutateAsync({
        roundIndex: currentRound.roundIndex,
        eventType: 'GROUP_EXPLANATION_SUBMIT',
        payload: {
          group_choice: groupChoice,
          explanation,
          key_terms: keyTerms.split(',').map(t => t.trim()).filter(Boolean),
          linked_highlight_ids: selectedHighlightIds,
        },
      });
      alert('Shared Card created successfully!');
    } catch (error) {
      console.error('Failed to submit explanation:', error);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6 space-y-6">
      {/* Prompt */}
      <div>
        <h3 className="text-lg font-semibold mb-2">Prompt:</h3>
        <p className="text-gray-700">{currentRound.promptJson.prompt_text || 'No prompt set'}</p>
        {currentRound.promptJson.options && currentRound.promptJson.options.length > 0 && (
          <div className="mt-2 space-y-1">
            {currentRound.promptJson.options.map((opt, idx) => (
              <div key={idx} className="text-sm text-gray-600">• {opt}</div>
            ))}
          </div>
        )}
      </div>

      {/* Voting */}
      {currentRound.status === 'VOTING' && (
        <div className="border-t pt-4">
          <h4 className="font-semibold mb-3">Cast Your Vote</h4>
          {currentRound.promptJson.options ? (
            <div className="space-y-2">
              {currentRound.promptJson.options.map((opt, idx) => (
                <label key={idx} className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="vote"
                    value={opt}
                    checked={voteChoice === opt}
                    onChange={(e) => setVoteChoice(e.target.value)}
                    disabled={hasVoted}
                    className="w-4 h-4"
                  />
                  <span>{opt}</span>
                </label>
              ))}
            </div>
          ) : (
            <input
              type="text"
              value={voteChoice}
              onChange={(e) => setVoteChoice(e.target.value)}
              disabled={hasVoted}
              placeholder="Enter your answer"
              className="w-full px-3 py-2 border rounded-md"
            />
          )}
          
          <textarea
            value={voteRationale}
            onChange={(e) => setVoteRationale(e.target.value)}
            disabled={hasVoted}
            placeholder="Optional: Explain your reasoning"
            className="w-full mt-3 px-3 py-2 border rounded-md"
            rows={2}
          />
          
          <button
            onClick={handleVoteSubmit}
            disabled={!voteChoice || hasVoted || submitEvent.isPending}
            className="mt-3 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {hasVoted ? 'Vote Submitted ✓' : 'Submit Vote'}
          </button>
        </div>
      )}

      {/* Discussing */}
      {currentRound.status === 'DISCUSSING' && (
        <div className="border-t pt-4">
          <h4 className="font-semibold mb-3">Discussion Phase</h4>
          <div className="bg-blue-50 border border-blue-200 rounded-md p-4 space-y-2 text-sm">
            {myRole === 'CLARIFIER' && (
              <div><strong>Your role (CLARIFIER):</strong> Ask clarifying questions</div>
            )}
            {myRole === 'CONNECTOR' && (
              <div><strong>Your role (CONNECTOR):</strong> Connect to real-world examples</div>
            )}
            {myRole === 'FACILITATOR' && (
              <div><strong>Your role (FACILITATOR):</strong> Ensure all voices are heard</div>
            )}
          </div>
          
          {canAdvance && (
            <button
              onClick={() => onAdvance('REVOTING')}
              className="mt-4 flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
            >
              Advance to Revoting <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      )}

      {/* Revoting */}
      {currentRound.status === 'REVOTING' && (
        <div className="border-t pt-4">
          <h4 className="font-semibold mb-3">Revote After Discussion</h4>
          {currentRound.promptJson.options ? (
            <div className="space-y-2">
              {currentRound.promptJson.options.map((opt, idx) => (
                <label key={idx} className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="revote"
                    value={opt}
                    checked={voteChoice === opt}
                    onChange={(e) => setVoteChoice(e.target.value)}
                    disabled={hasRevoted}
                    className="w-4 h-4"
                  />
                  <span>{opt}</span>
                </label>
              ))}
            </div>
          ) : (
            <input
              type="text"
              value={voteChoice}
              onChange={(e) => setVoteChoice(e.target.value)}
              disabled={hasRevoted}
              placeholder="Enter your answer"
              className="w-full px-3 py-2 border rounded-md"
            />
          )}
          
          <button
            onClick={handleRevoteSubmit}
            disabled={!voteChoice || hasRevoted || submitEvent.isPending}
            className="mt-3 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {hasRevoted ? 'Revote Submitted ✓' : 'Submit Revote'}
          </button>
        </div>
      )}

      {/* Explaining (SCRIBE only) */}
      {currentRound.status === 'EXPLAINING' && myRole === 'SCRIBE' && (
        <div className="border-t pt-4">
          <h4 className="font-semibold mb-3">Create Group Explanation (SCRIBE)</h4>
          
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium mb-1">Group's Final Answer:</label>
              <input
                type="text"
                value={groupChoice}
                onChange={(e) => setGroupChoice(e.target.value)}
                placeholder="Enter consensus answer"
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Explanation:</label>
              <textarea
                value={explanation}
                onChange={(e) => setExplanation(e.target.value)}
                placeholder="Explain the group's reasoning"
                className="w-full px-3 py-2 border rounded-md"
                rows={4}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Key Terms (comma-separated):</label>
              <input
                type="text"
                value={keyTerms}
                onChange={(e) => setKeyTerms(e.target.value)}
                placeholder="term1, term2, term3"
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>
            
            <div className="text-sm text-gray-600">
              {selectedHighlightIds.length} highlight(s) selected from Reference Panel
            </div>
            
            <button
              onClick={handleExplanationSubmit}
              disabled={!groupChoice || !explanation || submitEvent.isPending}
              className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 disabled:opacity-50"
            >
              Submit Group Explanation & Create Shared Card
            </button>
          </div>
        </div>
      )}

      {currentRound.status === 'EXPLAINING' && myRole !== 'SCRIBE' && (
        <div className="border-t pt-4 text-center text-gray-600">
          Waiting for SCRIBE to submit group explanation...
        </div>
      )}

      {/* Done */}
      {currentRound.status === 'DONE' && (
        <div className="border-t pt-4">
          <div className="bg-green-50 border border-green-200 rounded-md p-4 text-green-800">
            ✓ Round complete! Shared Card has been created.
          </div>
        </div>
      )}

      {/* Advance button */}
      {canAdvance && currentRound.status === 'VOTING' && (
        <div className="border-t pt-4">
          <button
            onClick={() => onAdvance('DISCUSSING')}
            className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
          >
            Advance to Discussion <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {canAdvance && currentRound.status === 'EXPLAINING' && (
        <div className="border-t pt-4">
          <button
            onClick={() => onAdvance('DONE')}
            className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
          >
            Complete Round <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
