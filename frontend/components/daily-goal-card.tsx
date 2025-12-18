'use client';

import { Target, CheckCircle2 } from 'lucide-react';

type DailyGoalProps = {
  goalType: 'MINUTES' | 'LESSONS';
  goalValue: number;
  progress: number; // minutes or lessons count
  goalMet: boolean;
};

export function DailyGoalCard({ goalType, goalValue, progress, goalMet }: DailyGoalProps) {
  const percent = Math.min(100, Math.round((progress / goalValue) * 100));

  return (
    <div className="overflow-hidden rounded-lg bg-white shadow border border-blue-100">
      <div className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-lg ${goalMet ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'}`}>
              {goalMet ? <CheckCircle2 size={20} /> : <Target size={20} />}
            </div>
            <span className="font-semibold text-gray-700">Meta Diária</span>
          </div>
          <span className="text-sm font-medium text-gray-500">
            {progress} / {goalValue} {goalType === 'MINUTES' ? 'min' : 'lições'}
          </span>
        </div>

        {/* Linear Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div 
            className={`h-2.5 rounded-full transition-all duration-500 ${goalMet ? 'bg-green-500' : 'bg-blue-600'}`} 
            style={{ width: `${percent}%` }}
          ></div>
        </div>
        
        <p className="mt-3 text-xs text-center text-gray-500">
          {goalMet ? 'Parabéns! Meta batida!' : `Faltam ${goalValue - progress} para completar.`}
        </p>
      </div>
    </div>
  );
}
