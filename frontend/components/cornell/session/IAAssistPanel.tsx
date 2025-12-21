import { useState } from 'react';
import { Sparkles, Loader2 } from 'lucide-react';
import api from '@/lib/api';

interface IAAssistPanelProps {
  contentId: string;
  onAssetGenerated?: (asset: any) => void;
}

export function IAAssistPanel({ contentId, onAssetGenerated }: IAAssistPanelProps) {
  const [generating, setGenerating] = useState(false);
  const [selectedLayer, setSelectedLayer] = useState<'L1' | 'L2' | 'L3'>('L1');
  const [status, setStatus] = useState<string>('');

  const handleGenerate = async () => {
    setGenerating(true);
    setStatus('Solicitando geração de conteúdo...');

    try {
      const { data: result } = await api.post(`/contents/${contentId}/assets/generate`, {
        layer: selectedLayer,
        educationLevel: '1_EM', // TODO: Get from user profile
        modality: 'READING',
        promptVersion: 'v1.0',
      });

      if (result.status === 'completed') {
        setStatus('✅ Conteúdo gerado com sucesso!');
        onAssetGenerated?.(result.asset);
      } else if (result.status === 'queued') {
        setStatus(`⏳ Geração em andamento... (Job ID: ${result.jobId.substring(0, 8)})`);
        // TODO: Implement polling for job completion
      }
    } catch (error) {
      setStatus('❌ Erro ao gerar conteúdo');
      console.error('Asset generation error:', error);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-lg p-6 border border-purple-200 dark:border-purple-800">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="w-5 h-5 text-purple-600 dark:text-purple-400" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          IA Cornell Assist
        </h3>
      </div>

      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
        Gere vocabulário, cues e quizzes automaticamente com IA otimizada.
      </p>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Nível de Complexidade
          </label>
          <div className="flex gap-2">
            {(['L1', 'L2', 'L3'] as const).map((layer) => (
              <button
                key={layer}
                onClick={() => setSelectedLayer(layer)}
                disabled={generating}
                className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedLayer === layer
                    ? 'bg-purple-600 text-white'
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {layer}
                <span className="block text-xs opacity-75">
                  {layer === 'L1' && 'Simplificado'}
                  {layer === 'L2' && 'Padrão'}
                  {layer === 'L3' && 'Avançado'}
                </span>
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={handleGenerate}
          disabled={generating}
          className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {generating ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Gerando...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              Gerar Conteúdo com IA
            </>
          )}
        </button>

        {status && (
          <div className="text-sm text-center p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            {status}
          </div>
        )}

        <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
          <p>💰 Custo médio: ~$0.04 por geração</p>
          <p>⚡ Tempo estimado: ~60 segundos</p>
          <p>🎯 Gera: vocabulário, cues, checkpoints, quiz</p>
        </div>
      </div>
    </div>
  );
}
