import { IOpsRepository } from '../../domain/interfaces/ops.repository.interface';
import { OpsTask } from '../../domain/entities/ops-task.entity';
export declare class GetTaskQueueUseCase {
    private readonly opsRepo;
    constructor(opsRepo: IOpsRepository);
    execute(userId: string): Promise<OpsTask[]>;
}
