'use client';

import { useQuery, useMutation } from '@tanstack/react-query';
import api from '@/lib/api';
import { Loader2, ArrowLeft, Wand2, GraduationCap, Layers, CheckCircle, ChevronLeft, FileText, Clock, User } from 'lucide-react';
import Link from 'next/link';
import { ROUTES } from '@/lib/config/routes';
import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';

type ContentVersion = {
  id: string;
  targetLanguage: string;
  schoolingLevelTarget: string;
  simplifiedText: string;
  summary?: string;
};

type Content = {
  id: string;
  title: string;
  type: string;
  originalLanguage: string;
  rawText: string;
  versions: ContentVersion[];
};

async function fetchContent(id: string) {
  const res = await api.get<Content>(`/content/${id}`);
  return res.data;
}

export default function ContentReaderPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [activeTab, setActiveTab] = useState<'original' | string>('original');
  const [minutesSpent, setMinutesSpent] = useState(0);
  const lastUpdateRef = useRef(Date.now());

  // Heartbeat to track time
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      const deltaMs = now - lastUpdateRef.current;
      // If active (user focused?), send update every 1 minute approx
      if (deltaMs >= 60000) {
        activityMutation.mutate({ minutesSpentDelta: 1 });
        lastUpdateRef.current = now;
      }
    }, 10000); // Check every 10s

    return () => clearInterval(interval);
  }, []);

  const activityMutation = useMutation({
    mutationFn: async (data: { minutesSpentDelta?: number; lessonsCompletedDelta?: number }) => {
      return api.post('/gamification/activity', data);
    }
  });

  const finishReadingMutation = useMutation({
    mutationFn: async () => {
        // Send final time + completion
        const now = Date.now();
        const deltaMs = now - lastUpdateRef.current;
        const minutes = Math.floor(deltaMs / 60000); // Only full minutes
        
        return api.post('/gamification/activity', { 
            minutesSpentDelta: minutes > 0 ? minutes : 1, // At least 1 min if clicking finish
            lessonsCompletedDelta: 1 
        });
    },
    onSuccess: () => {
        alert('Leitura concluída! Progresso registrado.');
        router.push(ROUTES.DASHBOARD.HOME);
    }
  });

  const { data: content, isLoading, isError } = useQuery({
    queryKey: ['content', id],
    queryFn: () => fetchContent(id),
  });

  const simplifyMutation = useMutation({
    mutationFn: async () => {
      return api.post(`/content/${id}/simplify`, {
        text: content?.rawText,
        level: '5_EF', // Default for demo
        lang: 'PT_BR'
      });
    },
    onSuccess: () => {
      alert('Tarefa de simplificação iniciada! Aguarde o processamento.');
    },
    onError: () => {
      alert('Erro ao iniciar simplificação.');
    }
  });

  const assessmentMutation = useMutation({
    mutationFn: async () => {
      return api.post(`/content/${id}/assessment`, {
        text: activeTab === 'original' 
          ? content?.rawText 
          : content?.versions.find(v => v.id === activeTab)?.simplifiedText,
        level: '1_EM'
      });
    },
    onSuccess: () => {
      alert('Tarefa de avaliação iniciada! Verifique a aba Avaliações em breve.');
    },
    onError: () => {
      alert('Erro ao gerar avaliação.');
    }
  });

  if (isLoading) return <div className="p-8 flex justify-center"><Loader2 className="animate-spin" /></div>;
  if (isError || !content) return <div className="p-8 text-red-500">Erro ao carregar conteúdo.</div>;

  const activeText = activeTab === 'original' 
    ? content.rawText 
    : content.versions.find(v => v.id === activeTab)?.simplifiedText || '';

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center space-x-4 mb-6">
        <Link href={ROUTES.DASHBOARD.LIBRARY.HOME} className="p-2 hover:bg-gray-100 rounded-full">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-2xl font-bold">{content.title}</h1>
      </div>

      {/* Tabs */}
      <div className="flex space-x-2 border-b border-gray-200 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('original')}
          className={`px-4 py-2 rounded-t-lg text-sm font-medium transition-colors ${
            activeTab === 'original' 
              ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-600' 
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Original
        </button>
        {content.versions.map((version) => (
          <button
            key={version.id}
            onClick={() => setActiveTab(version.id)}
            className={`px-4 py-2 rounded-t-lg text-sm font-medium transition-colors ${
              activeTab === version.id
                ? 'bg-green-50 text-green-700 border-b-2 border-green-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Simplificado ({version.schoolingLevelTarget})
          </button>
        ))}
      </div>

      {/* Toolkit */}
      <div className="flex space-x-2 py-2 justify-between">
        <div className="flex space-x-2">
            <button 
            onClick={() => simplifyMutation.mutate()}
            disabled={simplifyMutation.isPending}
            className="flex items-center space-x-2 px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-md text-sm hover:bg-indigo-100 disabled:opacity-50"
            >
            {simplifyMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <Wand2 size={16} />}
            <span>Simplificar (IA)</span>
            </button>

            <button 
            onClick={() => assessmentMutation.mutate()}
            disabled={assessmentMutation.isPending}
            className="flex items-center space-x-2 px-3 py-1.5 bg-orange-50 text-orange-700 rounded-md text-sm hover:bg-orange-100 disabled:opacity-50"
            >
            {assessmentMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <GraduationCap size={16} />}
            <span>Gerar Questões</span>
            </button>
        </div>
        
        <button
            onClick={() => finishReadingMutation.mutate()}
            className="flex items-center space-x-2 px-4 py-1.5 bg-green-600 text-white rounded-md text-sm hover:bg-green-700 shadow-sm"
        >
            <CheckCircle size={16} />
            <span>Concluir Leitura</span>
        </button>
      </div>

      {/* Reader Area */}
      <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-100 min-h-[500px] leading-relaxed text-gray-800 text-lg whitespace-pre-wrap">
        {activeText}
      </div>
    </div>
  );
}
