import { IOpsRepository } from '../../domain/interfaces/ops.repository.interface';
import { OpsSnapshot } from '../../domain/entities/ops-snapshot.entity';
import { GetTaskQueueUseCase } from './get-task-queue.use-case';
export declare class GetDailySnapshotUseCase {
    private readonly opsRepo;
    private readonly getTaskQueue;
    constructor(opsRepo: IOpsRepository, getTaskQueue: GetTaskQueueUseCase);
    execute(userId: string): Promise<OpsSnapshot>;
}
