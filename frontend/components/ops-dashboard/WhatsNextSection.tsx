'use client';

import Link from 'next/link';
import { Clock, PlayCircle, SkipForward, ArrowRight } from 'lucide-react';

interface Task {
  id: string;
  title: string;
  description: string;
  estimatedMin: number;
  type: string;
  ctaUrl?: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
}

interface WhatsNextSectionProps {
  tasks: Task[];
}

export function WhatsNextSection({ tasks }: WhatsNextSectionProps) {
  if (!tasks || tasks.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">What's Next</h2>
        <Link href="/dashboard/tasks" className="text-sm text-blue-600 hover:text-blue-700">
          View All
        </Link>
      </div>

      <div className="space-y-3">
        {tasks.map((task, index) => (
          <TaskCard key={task.id} task={task} index={index} />
        ))}
      </div>
    </div>
  );
}

interface TaskCardProps {
  task: Task;
  index: number;
}

function TaskCard({ task, index }: TaskCardProps) {
  const priorityColors = {
    HIGH: 'bg-red-50 border-red-200 text-red-700',
    MEDIUM: 'bg-yellow-50 border-yellow-200 text-yellow-700',
    LOW: 'bg-gray-50 border-gray-200 text-gray-700',
  };

  const color = priorityColors[task.priority];

  return (
    <div className={`border rounded-lg p-4 ${color} hover:shadow-md transition-all group`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold opacity-60">#{index + 1}</span>
            <h3 className="text-sm font-medium truncate">{task.title}</h3>
          </div>
          <p className="text-xs opacity-70 mb-2">{task.description}</p>
          
          <div className="flex items-center gap-2 text-xs">
            <Clock className="h-3 w-3" />
            <span>{task.estimatedMin} min</span>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          {task.ctaUrl && (
            <Link
              href={task.ctaUrl}
              className="flex items-center gap-1 px-3 py-1.5 bg-white rounded-md text-xs font-medium shadow-sm hover:shadow transition-all"
            >
              <PlayCircle className="h-3 w-3" />
              Start
            </Link>
          )}
          
          <button className="p-1.5 bg-white rounded-md opacity-50 hover:opacity-100 transition-opacity">
            <SkipForward className="h-3 w-3" />
          </button>
        </div>
      </div>
    </div>
  );
}
