import { IHighlightsRepository } from "../../domain/interfaces/highlights.repository.interface";
import { Highlight } from "../../domain/entities/highlight.entity";
export declare class GetHighlightsUseCase {
    private readonly highlightsRepository;
    constructor(highlightsRepository: IHighlightsRepository);
    execute(contentId: string, userId: string): Promise<Highlight[]>;
}
