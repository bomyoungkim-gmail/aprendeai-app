import { OpsTask } from './ops-task.entity';
export declare class OpsSnapshot {
    readonly userId: string;
    readonly date: Date;
    readonly progress: {
        minutesToday: number;
        lessonsCompleted: number;
        comprehensionAvg: number;
        streakDays: number;
        goalMet: boolean;
    };
    readonly goals: {
        dailyMinutes: number;
        goalType: 'MINUTES';
    };
    readonly nextTasks: OpsTask[];
    constructor(userId: string, date: Date, progress: {
        minutesToday: number;
        lessonsCompleted: number;
        comprehensionAvg: number;
        streakDays: number;
        goalMet: boolean;
    }, goals: {
        dailyMinutes: number;
        goalType: 'MINUTES';
    }, nextTasks: OpsTask[]);
}
