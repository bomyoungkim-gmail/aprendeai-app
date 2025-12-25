import React from 'react';

interface StatsCardProps {
  name: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
  trend?: {
    value: number; // e.g., 12 (percent)
    label: string; // e.g., "vs last month"
    positive?: boolean;
  };
}

export const StatsCard: React.FC<StatsCardProps> = ({ name, value, icon, color, trend }) => {
  return (
    <div className="bg-white overflow-hidden shadow rounded-lg">
      <div className="p-5">
        <div className="flex items-center">
          <div className={`flex-shrink-0 rounded-md p-3 ${color}`}>
            <span className="text-2xl text-white flex items-center justify-center w-8 h-8">
              {icon}
            </span>
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-gray-500 truncate">{name}</dt>
              <dd className="text-3xl font-semibold text-gray-900">{value}</dd>
              {trend && (
                <dd className="flex items-baseline text-sm">
                  <span className={trend.positive ? 'text-green-600' : 'text-red-600'}>
                    {trend.positive ? '↑' : '↓'} {Math.abs(trend.value)}%
                  </span>
                  <span className="text-gray-400 ml-2">{trend.label}</span>
                </dd>
              )}
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
};
