import { Injectable, Inject } from '@nestjs/common';
import { IOpsRepository } from '../../domain/interfaces/ops.repository.interface';

@Injectable()
export class LogStudyTimeUseCase {
  constructor(@Inject(IOpsRepository) private readonly opsRepo: IOpsRepository) {}

  async execute(userId: string, minutes: number): Promise<{ success: boolean; message: string }> {
    await this.opsRepo.logStudyTime(userId, minutes);
    
    return {
      success: true,
      message: `Logged ${minutes} minutes of study time`,
    };
  }
}
