import { IHighlightsRepository } from "../../domain/interfaces/highlights.repository.interface";
export declare class DeleteHighlightUseCase {
    private readonly highlightsRepository;
    constructor(highlightsRepository: IHighlightsRepository);
    execute(id: string, userId: string): Promise<void>;
}
