export type TaskPriority = 'HIGH' | 'MEDIUM' | 'LOW';
export type TaskType = 'REVIEW' | 'CO_READING' | 'LESSON' | 'PLANNING';
export declare class OpsTask {
    readonly id: string;
    readonly title: string;
    readonly description: string;
    readonly estimatedMin: number;
    readonly type: TaskType;
    readonly ctaUrl: string;
    readonly priority: TaskPriority;
    constructor(id: string, title: string, description: string, estimatedMin: number, type: TaskType, ctaUrl: string, priority: TaskPriority);
}
