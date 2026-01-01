'use client';

import Link from 'next/link';
import { BookOpen, FileText, Image, FileCheck } from 'lucide-react';
import type { Content } from '@/lib/types/cornell';

import { ContentType } from '@/lib/constants/enums';

interface ContentItemProps {
  content: Content;
}

export function ContentItem({ content }: ContentItemProps) {
  const getIcon = () => {
    switch (content.contentType) {
      case ContentType.PDF:
        return <FileText className="h-5 w-5 text-red-600" />;
      case ContentType.IMAGE:
        return <Image className="h-5 w-5 text-blue-600" />;
      case ContentType.DOCX:
        return <FileCheck className="h-5 w-5 text-blue-800" />;
      case ContentType.ARTICLE:
      case ContentType.NEWS:
      case ContentType.ARXIV:
      case ContentType.WEB_CLIP:
        return <BookOpen className="h-5 w-5 text-green-600" />;
      case ContentType.SCHOOL_MATERIAL:
        return <BookOpen className="h-5 w-5 text-orange-600" />;
      case ContentType.VIDEO:
        return <FileText className="h-5 w-5 text-purple-600" />;
      case ContentType.AUDIO:
        return <FileText className="h-5 w-5 text-indigo-600" />;
      default:
        return <FileText className="h-5 w-5 text-gray-600" />;
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <Link
      href={`/reader/${content.id}`}
      className="block p-4 bg-white border border-gray-200 rounded-lg hover:border-blue-500 hover:shadow-md transition-all group"
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className="flex-shrink-0 mt-1">{getIcon()}</div>

        {/* Content Info */}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors truncate">
            {content.title}
          </h3>
          <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
            <span className="inline-flex items-center px-2 py-0.5 rounded bg-gray-100 text-gray-700 text-xs font-medium">
              {content.contentType}
            </span>
            <span>{formatDate(content.createdAt)}</span>
          </div>
        </div>

        {/* Arrow */}
        <div className="flex-shrink-0">
          <svg
            className="h-5 w-5 text-gray-400 group-hover:text-blue-600 transition-colors"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </div>
      </div>
    </Link>
  );
}
