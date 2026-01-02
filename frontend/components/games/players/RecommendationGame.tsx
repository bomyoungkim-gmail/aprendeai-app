import { useState, useMemo } from 'react';
import { GameQuestion } from '@/services/api/games.api';

interface RecommendationGameProps {
  onComplete: (score: number, won: boolean) => void;
  questions?: GameQuestion[];
}

/**
 * RECOMMENDATION_ENGINE - Suggest content based on criteria
 */
export function RecommendationGame({ onComplete, questions }: RecommendationGameProps) {
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [reasoning, setReasoning] = useState('');

  // Map Backend Data
  const gameData = useMemo(() => {
    if (questions && questions.length > 0) {
      const q = questions[0];
      return {
        userProfile: q.text,
        contents: (q.options || []).map((opt, idx) => ({
            id: idx + 1,
            title: opt,
            relevance: "unknown" // Backend needs to tell us. Assuming all options provided are 'candidates', validation happens elsewhere or via hidden field.
        }))
      };
    }
    return {
      userProfile: "Estudante de biologia, nível intermediário, interessado em evolução",
      contents: [
        { id: 1, title: "A Origem das Espécies", relevance: "high" },
        { id: 2, title: "Física Quântica Para Iniciantes", relevance: "low" },
        { id: 3, title: "Genética e Evolução Molecular", relevance: "high" },
        { id: 4, title: "História da Arte Moderna", relevance: "low" },
      ]
    };
  }, [questions]);
  
  const { userProfile, contents } = gameData;

  const toggleContent = (id: number) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleSubmit = () => {
    const relevant = contents.filter(c => c.relevance === "high").map(c => c.id);
    const correctSelections = selectedIds.filter(id => relevant.includes(id)).length;
    const totalRelevant = relevant.length;
    
    const selectionScore = (correctSelections / totalRelevant) * 60;
    const reasoningScore = reasoning.length >= 40 ? 40 : 0;
    
    const score = selectionScore + reasoningScore;
    onComplete(score, score >= 70);
  };

  return (
    <div className="space-y-4">
      <div className="bg-cyan-50 p-4 rounded-lg">
        <h3 className="font-bold mb-2">💡 Recomende para:</h3>
        <p className="text-sm text-gray-700">"{userProfile}"</p>
      </div>

      <div className="space-y-2">
        {contents.map(content => (
          <button
            key={content.id}
            onClick={() => toggleContent(content.id)}
            className={`w-full p-4 text-left rounded-lg border-2 ${
              selectedIds.includes(content.id)
                ? 'border-cyan-600 bg-cyan-50'
                : 'border-gray-200 hover:border-cyan-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                selectedIds.includes(content.id) ? 'bg-cyan-600 border-cyan-600' : 'border-gray-300'
              }`}>
                {selectedIds.includes(content.id) && <span className="text-white text-xs">✓</span>}
              </div>
              <span>{content.title}</span>
            </div>
          </button>
        ))}
      </div>

      {selectedIds.length > 0 && (
        <div>
          <label className="block text-sm font-medium mb-1">
            Justifique suas escolhas:
          </label>
          <textarea
            value={reasoning}
            onChange={(e) => setReasoning(e.target.value)}
            placeholder="Explique por que esses conteúdos são relevantes para o perfil..."
            className="w-full border rounded-lg p-3 h-24"
          />
          <p className="text-xs text-gray-500 mt-1">{reasoning.length} / 40 caracteres mín.</p>
        </div>
      )}

      <button
        onClick={handleSubmit}
        disabled={selectedIds.length === 0 || reasoning.length < 40}
        className="w-full bg-cyan-600 text-white py-2 rounded-lg hover:bg-cyan-700 disabled:opacity-50"
      >
        Enviar Recomendações
      </button>
    </div>
  );
}
