'use client';

import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { Loader2, Book, FileText } from 'lucide-react';
import Link from 'next/link';

type Content = {
  id: string;
  title: string;
  type: string;
  originalLanguage: string;
  createdAt: string;
};

async function fetchContents() {
  const res = await api.get<Content[]>('/content');
  return res.data;
}

export default function LibraryPage() {
  const { data: contents, isLoading, error } = useQuery({
    queryKey: ['contents'],
    queryFn: fetchContents,
  });

  if (isLoading) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-red-600 bg-red-50 rounded">
        Erro ao carregar conteúdos. Tente novamente mais tarde.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Biblioteca</h1>
        {/* <Button>Adicionar Conteúdo</Button> */}
      </div>

      <div className="grid grid-cols-1 gap-4 md:gap-6 md:grid-cols-2 lg:grid-cols-3">
        {contents?.map((content) => (
          <Link 
            key={content.id} 
            href={`/dashboard/library/${content.id}`}
            className="block group"
          >
            <div className="h-full overflow-hidden rounded-lg bg-white shadow transition-shadow hover:shadow-md border border-gray-100">
              <div className="p-5">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                    {content.type === 'ARXIV' ? <Book size={20} /> : <FileText size={20} />}
                  </div>
                  <div>
                    <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">
                      {content.type}
                    </span>
                  </div>
                </div>
                
                <h3 className="text-lg font-semibold leading-6 text-gray-900 group-hover:text-blue-600 line-clamp-2">
                  {content.title}
                </h3>
                
                <div className="mt-4 flex items-center justify-between text-sm text-gray-500">
                  <span>{new Date(content.createdAt).toLocaleDateString()}</span>
                  <span>{content.originalLanguage}</span>
                </div>
              </div>
            </div>
          </Link>
        ))}
        
        {contents?.length === 0 && (
          <div className="col-span-full py-12 text-center text-gray-500">
            Nenhum conteúdo encontrado na biblioteca.
          </div>
        )}
      </div>
    </div>
  );
}
