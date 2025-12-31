import { OpsTask } from './ops-task.entity';

export class OpsSnapshot {
  constructor(
    public readonly userId: string,
    public readonly date: Date,
    public readonly progress: {
      minutesToday: number;
      lessonsCompleted: number;
      comprehensionAvg: number;
      streakDays: number;
      goalMet: boolean;
    },
    public readonly goals: {
      dailyMinutes: number;
      goalType: 'MINUTES';
    },
    public readonly nextTasks: OpsTask[],
  ) {}
}
