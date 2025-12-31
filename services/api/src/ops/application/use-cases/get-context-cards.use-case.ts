import { Injectable, Inject } from '@nestjs/common';
import { IOpsRepository } from '../../domain/interfaces/ops.repository.interface';
import { ContextCard } from '../../domain/entities/context-card.entity';

@Injectable()
export class GetContextCardsUseCase {
  constructor(@Inject(IOpsRepository) private readonly opsRepo: IOpsRepository) {}

  async execute(userId: string): Promise<ContextCard[]> {
    const cards: ContextCard[] = [];
    const today = new Date().getDay();

    // 1. Fetch Policy
    const policy = await this.opsRepo.getUserPolicy(userId);

    // 2. Co-Reading reminder
    const isCoReadingDay = (policy as any)?.co_reading_days?.includes(today);
    if (isCoReadingDay) {
      cards.push(new ContextCard(
        'co-reading-reminder',
        'CO_READING',
        '🗓️ Co-Reading Time!',
        'You have a co-reading session scheduled for today.',
        'Start Session',
        '/families/co-sessions/start',
        'blue'
      ));
    }

    // 3. Weekly plan (Sundays)
    if (today === 0) {
      cards.push(new ContextCard(
        'weekly-plan',
        'WEEKLY_PLAN',
        '📅 Plan Your Week',
        'Take a moment to set your goals for the week ahead.',
        'Create Plan',
        '/dashboard/planning',
        'purple'
      ));
    }

    return cards;
  }
}
