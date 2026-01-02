export type TaskPriority = "HIGH" | "MEDIUM" | "LOW";
export type TaskType = "REVIEW" | "CO_READING" | "LESSON" | "PLANNING";

export class OpsTask {
  constructor(
    public readonly id: string,
    public readonly title: string,
    public readonly description: string,
    public readonly estimatedMin: number,
    public readonly type: TaskType,
    public readonly ctaUrl: string,
    public readonly priority: TaskPriority,
  ) {}
}
