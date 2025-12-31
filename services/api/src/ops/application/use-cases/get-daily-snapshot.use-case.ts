import { Injectable, Inject } from '@nestjs/common';
import { IOpsRepository } from '../../domain/interfaces/ops.repository.interface';
import { OpsSnapshot } from '../../domain/entities/ops-snapshot.entity';
import { GetTaskQueueUseCase } from './get-task-queue.use-case';
import { FAMILY_CONFIG } from '../../../config/family-classroom.config';

@Injectable()
export class GetDailySnapshotUseCase {
  constructor(
    @Inject(IOpsRepository) private readonly opsRepo: IOpsRepository,
    private readonly getTaskQueue: GetTaskQueueUseCase,
  ) {}

  async execute(userId: string): Promise<OpsSnapshot> {
    const today = new Date();
    
    // 1. Fetch metrics from Repository
    const minutesToday = await this.opsRepo.getDailyMinutesSpent(userId, today);
    const lessonsCompleted = await this.opsRepo.getLessonsCompletedCount(userId, today);
    const streakDays = await this.opsRepo.calculateStreak(userId);
    
    // 2. Fetch Policy for goals
    const policy = await this.opsRepo.getUserPolicy(userId);
    const dailyMinutes = (policy as any)?.daily_min_minutes || FAMILY_CONFIG.POLICY.DEFAULT_DAILY_MIN_MINUTES;

    // 3. Get next tasks
    const nextTasks = await this.getTaskQueue.execute(userId);

    // 4. Construct Domain Snapshot
    return new OpsSnapshot(
      userId,
      today,
      {
        minutesToday,
        lessonsCompleted,
        comprehensionAvg: 0, // Logic to be added later
        streakDays,
        goalMet: minutesToday >= dailyMinutes,
      },
      {
        dailyMinutes,
        goalType: 'MINUTES',
      },
      nextTasks,
    );
  }
}
