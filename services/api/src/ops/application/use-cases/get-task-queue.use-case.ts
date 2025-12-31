import { Injectable, Inject } from '@nestjs/common';
import { IOpsRepository } from '../../domain/interfaces/ops.repository.interface';
import { OpsTask } from '../../domain/entities/ops-task.entity';

@Injectable()
export class GetTaskQueueUseCase {
  constructor(@Inject(IOpsRepository) private readonly opsRepo: IOpsRepository) {}

  async execute(userId: string): Promise<OpsTask[]> {
    const tasks: OpsTask[] = [];

    // 1. Check for due SRS reviews (Mock for now, same as original service)
    const dueReviews = 0; 

    if (dueReviews > 0) {
      tasks.push(new OpsTask(
        'review-vocab',
        'Review Vocabulary',
        `${dueReviews} cards waiting`,
        Math.min(dueReviews * 2, 30),
        'REVIEW',
        '/dashboard/review',
        'HIGH'
      ));
    }

    // 2. Check for co-reading (Fetch policy)
    const policy = await this.opsRepo.getUserPolicy(userId);
    const todayIndex = new Date().getDay();
    const isCoReadingDay = (policy as any)?.co_reading_days?.includes(todayIndex);

    if (isCoReadingDay) {
      tasks.push(new OpsTask(
        'co-reading',
        'Co-Reading Session',
        'Scheduled with your educator',
        20,
        'CO_READING',
        '/dashboard/co-reading',
        'HIGH'
      ));
    }

    // 3. Add default task if queue is empty
    if (tasks.length === 0) {
      tasks.push(new OpsTask(
        'continue-learning',
        'Continue Learning',
        'Pick up where you left off',
        15,
        'LESSON',
        '/dashboard/library',
        'MEDIUM'
      ));
    }

    return tasks.slice(0, 3);
  }
}
