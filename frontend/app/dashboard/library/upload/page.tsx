'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { cornellApi } from '@/lib/api/cornell';
import { Loader2, Upload, Youtube, FileText, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { ContentType } from '@/lib/constants/enums';

export default function UploadPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'youtube' | 'file'>('youtube');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // YouTube Form State
  const [youtubeUrl, setYoutubeUrl] = useState('');

  // File Form State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleYoutubeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!youtubeUrl) return;

    setIsLoading(true);
    setError(null);

    try {
      await cornellApi.createManualContent({
        type: ContentType.VIDEO,
        sourceUrl: youtubeUrl,
        title: 'YouTube Import', // Backend will likely fetch metadata
      });
      router.push('/dashboard/library');
    } catch (err) {
      console.error(err);
      setError('Falha ao importar vídeo. Verifique a URL.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;

    setIsLoading(true);
    setError(null);

    try {
      await cornellApi.uploadContent(selectedFile);
      router.push('/dashboard/library');
    } catch (err) {
      console.error(err);
      setError('Falha ao fazer upload. Tente um arquivo menor ou PDF/DOCX.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 p-6">
      <div className="flex items-center space-x-4 mb-8">
        <Link href="/dashboard/library" className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <ArrowLeft size={24} />
        </Link>
        <h1 className="text-2xl font-bold">Adicionar Conteúdo</h1>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow border border-gray-200 dark:border-gray-700 overflow-hidden">
        {/* Tabs */}
        <div className="flex border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setActiveTab('youtube')}
            className={`flex-1 py-4 text-center font-medium transition-colors flex items-center justify-center space-x-2 ${
              activeTab === 'youtube'
                ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            <Youtube size={20} />
            <span>YouTube</span>
          </button>
          <button
            onClick={() => setActiveTab('file')}
            className={`flex-1 py-4 text-center font-medium transition-colors flex items-center justify-center space-x-2 ${
              activeTab === 'file'
                ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            <Upload size={20} />
            <span>Arquivo (PDF)</span>
          </button>
        </div>

        <div className="p-8">
          {error && (
            <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-lg border border-red-200">
              {error}
            </div>
          )}

          {activeTab === 'youtube' ? (
            <form onSubmit={handleYoutubeSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  URL do Vídeo
                </label>
                <input
                  type="url"
                  placeholder="https://www.youtube.com/watch?v=..."
                  value={youtubeUrl}
                  onChange={(e) => setYoutubeUrl(e.target.value)}
                  className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
              >
                {isLoading ? <Loader2 className="animate-spin" /> : <Youtube size={20} />}
                <span>Importar do YouTube</span>
              </button>
            </form>
          ) : (
            <form onSubmit={handleFileSubmit} className="space-y-6">
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-12 text-center hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer relative">
                <input
                  type="file"
                  accept=".pdf,.docx,.txt"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
                <div className="flex flex-col items-center pointer-events-none">
                    {selectedFile ? (
                        <>
                            <FileText size={48} className="text-blue-500 mb-4" />
                            <p className="text-lg font-medium text-gray-900 dark:text-white">
                                {selectedFile.name}
                            </p>
                            <p className="text-sm text-gray-500 mt-1">
                                {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                        </>
                    ) : (
                        <>
                            <Upload size={48} className="text-gray-400 mb-4" />
                            <p className="text-lg font-medium text-gray-900 dark:text-white">
                                Arraste um arquivo ou clique para selecionar
                            </p>
                            <p className="text-sm text-gray-500 mt-1">
                                PDF, DOCX ou TXT (Max 20MB)
                            </p>
                        </>
                    )}
                </div>
              </div>
              <button
                type="submit"
                disabled={isLoading || !selectedFile}
                className="w-full py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
              >
                {isLoading ? <Loader2 className="animate-spin" /> : <Upload size={20} />}
                <span>Fazer Upload</span>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
