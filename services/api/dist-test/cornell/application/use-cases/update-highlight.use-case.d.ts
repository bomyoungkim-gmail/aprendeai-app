import { IHighlightsRepository } from "../../domain/interfaces/highlights.repository.interface";
import { UpdateHighlightDto } from "../../dto/cornell.dto";
import { Highlight } from "../../domain/entities/highlight.entity";
export declare class UpdateHighlightUseCase {
    private readonly highlightsRepository;
    constructor(highlightsRepository: IHighlightsRepository);
    execute(id: string, dto: UpdateHighlightDto, userId: string): Promise<Highlight>;
}
