import Link from 'next/link';
import { Clock, BookOpen, BarChart3 } from 'lucide-react';

interface SessionCardProps {
  session: {
    id: string;
    startedAt: string;
    finishedAt: string | null;
    duration: number | null;
    phase: 'PRE' | 'DURING' | 'POST';
    content: {
      id: string;
      title: string;
      type: string;
    };
    eventsCount: number;
  };
}

export function SessionCard({ session }: SessionCardProps) {
  const phaseColors = {
    PRE: 'bg-blue-100 text-blue-800',
    DURING: 'bg-green-100 text-green-800',
    POST: 'bg-gray-100 text-gray-800',
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="border rounded-lg p-4 hover:shadow-md transition bg-white">
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          <h3 className="font-semibold text-lg mb-1">{session.content.title}</h3>
          <p className="text-sm text-gray-600">{formatDate(session.startedAt)}</p>
        </div>
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${phaseColors[session.phase]}`}>
          {session.phase}
        </span>
      </div>

      <div className="flex gap-4 text-sm text-gray-600 mb-4">
        <span className="flex items-center gap-1">
          <BookOpen className="w-4 h-4" />
          {session.content.type}
        </span>
        {session.duration && (
          <span className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            {session.duration} min
          </span>
        )}
        <span className="flex items-center gap-1">
          <BarChart3 className="w-4 h-4" />
          {session.eventsCount} events
        </span>
      </div>

      <div className="flex gap-2">
        <Link
          href={`/reading/${session.id}`}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium"
        >
          Continue
        </Link>
        <Link
          href={`/sessions/${session.id}`}
          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 text-sm font-medium"
        >
          View Details
        </Link>
      </div>
    </div>
  );
}
