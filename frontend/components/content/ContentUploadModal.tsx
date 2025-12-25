'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useDropzone } from 'react-dropzone';
import { Upload, X, FileText, CheckCircle, AlertCircle } from 'lucide-react';
import { useUploadContent } from '@/hooks/use-content-upload';

interface ContentUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ContentUploadModal({ isOpen, onClose }: ContentUploadModalProps) {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const upload = useUploadContent();

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      upload.reset();
      setFile(null);
      setTitle('');
    }
  }, [isOpen]);

  const { getRootProps, getInputProps, isDragActive, fileRejections } = useDropzone({
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/plain': ['.txt'],
    },
    maxSize: 20 * 1024 * 1024, // 20MB
    multiple: false,
    onDrop: (acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        const f = acceptedFiles[0];
        setFile(f);
        // Auto-fill title from filename (remove extension)
        if (!title) {
          setTitle(f.name.replace(/\.[^/.]+$/, ''));
        }
      }
    },
  });

  const handleUpload = async () => {
    if (!file || !title.trim()) return;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', title.trim());
    formData.append('originalLanguage', 'PT_BR');

    try {
      const result = await upload.mutateAsync(formData);
      // Reset form
      setFile(null);
      setTitle('');
      onClose();
      
      // Navigate to the newly uploaded content
      if (result && result.id) {
        router.push(`/reader/${result.id}`);
      }
    } catch (error) {
      console.error('Upload failed:', error);
    }
  };

  const handleRemoveFile = () => {
    setFile(null);
    setTitle('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-lg p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto border border-gray-200 dark:border-gray-700">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Upload de Conteúdo</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors text-gray-600 dark:text-gray-300"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Dropzone */}
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all ${
            isDragActive
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
              : file
              ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
              : 'border-gray-300 dark:border-gray-600 hover:border-blue-400 hover:bg-gray-50 dark:hover:bg-gray-800'
          }`}
        >
          <input {...getInputProps()} />
          <div className="flex flex-col items-center gap-3">
            {file ? (
              <CheckCircle className="w-12 h-12 text-green-600 dark:text-green-400" />
            ) : (
              <Upload className="w-12 h-12 text-gray-400 dark:text-gray-500" />
            )}
            
            {isDragActive ? (
              <p className="text-blue-600 dark:text-blue-400 font-medium">Solte o arquivo aqui...</p>
            ) : file ? (
              <p className="text-green-600 dark:text-green-400 font-medium">Arquivo pronto para upload!</p>
            ) : (
              <>
                <p className="text-gray-700 dark:text-gray-300">
                  Arraste um arquivo ou <span className="text-blue-600 dark:text-blue-400 font-medium">clique para selecionar</span>
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">PDF, DOCX, TXT (máx. 20MB)</p>
              </>
            )}
          </div>
        </div>

        {/* File Rejections */}
        {fileRejections.length > 0 && (
          <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-red-700 dark:text-red-300">
              {fileRejections[0].errors[0].code === 'file-too-large' && (
                <p>Arquivo muito grande. Máximo: 20MB</p>
              )}
              {fileRejections[0].errors[0].code === 'file-invalid-type' && (
                <p>Tipo de arquivo não suportado. Use PDF, DOCX ou TXT.</p>
              )}
            </div>
          </div>
        )}

        {/* Selected File Preview */}
        {file && (
          <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileText className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              <div>
                <p className="font-medium text-gray-900 dark:text-white">{file.name}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            </div>
            <button
              onClick={handleRemoveFile}
              className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            </button>
          </div>
        )}

        {/* Title Input */}
        <div className="mt-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Título do Conteúdo *
          </label>
          <input
            type="text"
            name="title"
            data-testid="upload-title-input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Ex: Capítulo 3 - Fotossíntese"
            maxLength={200}
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{title.length}/200 caracteres</p>
        </div>

        {/* Upload Error */}
        {upload.isError && (
          <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700 dark:text-red-300">
              Erro ao fazer upload. Tente novamente.
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="mt-6 flex gap-3">
          <button
            onClick={onClose}
            disabled={upload.isPending}
            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleUpload}
            disabled={!file || !title.trim() || upload.isPending}
            data-testid="upload-submit-btn"
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            {upload.isPending ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                Fazer Upload
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
