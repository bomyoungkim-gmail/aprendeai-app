import { IOpsRepository } from '../../domain/interfaces/ops.repository.interface';
import { ContextCard } from '../../domain/entities/context-card.entity';
export declare class GetContextCardsUseCase {
    private readonly opsRepo;
    constructor(opsRepo: IOpsRepository);
    execute(userId: string): Promise<ContextCard[]>;
}
