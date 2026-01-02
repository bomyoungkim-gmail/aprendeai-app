export class Activity {
  constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly date: Date,
    public readonly minutesStudied: number = 0,
    public readonly sessionsCount: number = 0,
    public readonly contentsRead: number = 0,
    public readonly annotationsCreated: number = 0,
  ) {}
}

export interface ActivityStats {
  totalDays: number;
  activeTopics: number;
  currentStreak: number;
  longestStreak: number;
  avgMinutesPerDay: number;
  thisWeekMinutes: number;
  thisMonthMinutes: number;
}

export interface HeatmapData {
  date: string;
  minutesStudied: number;
  sessionsCount: number;
  contentsRead: number;
  annotationsCreated: number;
}
