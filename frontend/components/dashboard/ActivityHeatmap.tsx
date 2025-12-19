'use client';

import CalendarHeatmap from 'react-calendar-heatmap';
import 'react-calendar-heatmap/dist/styles.css';
import { subDays } from 'date-fns';

interface HeatmapValue {
  date: string;
  count: number;
}

interface ActivityHeatmapProps {
  data: Array<{
    date: string;
    minutesStudied: number;
  }>;
  className?: string;
}

export function ActivityHeatmap({ data, className = '' }: ActivityHeatmapProps) {
  const startDate = subDays(new Date(), 365);
  const endDate = new Date();

  // Transform data for heatmap
  const values: HeatmapValue[] = data.map((item) => ({
    date: item.date,
    count: item.minutesStudied,
  }));

  // Get intensity class based on minutes
  const classForValue = (value: HeatmapValue | undefined) => {
    if (!value || value.count === 0) {
      return 'color-empty';
    }
    if (value.count < 30) {
      return 'color-scale-1';
    }
    if (value.count < 60) {
      return 'color-scale-2';
    }
    if (value.count < 120) {
      return 'color-scale-3';
    }
    return 'color-scale-4';
  };

  // Tooltip content
  const titleForValue = (value: HeatmapValue | undefined) => {
    if (!value || !value.date) {
      return 'No activity';
    }
    const date = new Date(value.date);
    const minutes = value.count || 0;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;

    let timeStr = '';
    if (hours > 0) {
      timeStr = `${hours}h ${mins}m`;
    } else {
      timeStr = `${mins} min`;
    }

    return `${date.toLocaleDateString()}: ${timeStr}`;
  };

  return (
    <div className={`activity-heatmap ${className}`}>
      <CalendarHeatmap
        startDate={startDate}
        endDate={endDate}
        values={values}
        classForValue={classForValue}
        titleForValue={titleForValue}
        showWeekdayLabels
      />

      {/* Color Legend */}
      <div className="flex items-center gap-2 mt-4 text-xs text-gray-600">
        <span>Less</span>
        <div className="flex gap-1">
          <div className="w-3 h-3 rounded-sm color-empty border border-gray-200" />
          <div className="w-3 h-3 rounded-sm color-scale-1" />
          <div className="w-3 h-3 rounded-sm color-scale-2" />
          <div className="w-3 h-3 rounded-sm color-scale-3" />
          <div className="w-3 h-3 rounded-sm color-scale-4" />
        </div>
        <span>More</span>
      </div>

      <style jsx global>{`
        .react-calendar-heatmap {
          width: 100%;
        }

        .react-calendar-heatmap text {
          font-size: 10px;
          fill: #666;
        }

        .react-calendar-heatmap rect {
          rx: 2;
        }

        .react-calendar-heatmap rect:hover {
          stroke: #555;
          stroke-width: 1px;
        }

        .react-calendar-heatmap .color-empty {
          fill: #ebedf0;
        }

        .react-calendar-heatmap .color-scale-1 {
          fill: #9be9a8;
        }

        .react-calendar-heatmap .color-scale-2 {
          fill: #40c463;
        }

        .react-calendar-heatmap .color-scale-3 {
          fill: #30a14e;
        }

        .react-calendar-heatmap .color-scale-4 {
          fill: #216e39;
        }
      `}</style>
    </div>
  );
}
