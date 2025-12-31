import { ICornellRepository } from "../../domain/interfaces/cornell.repository.interface";
import { CornellNote } from "../../domain/entities/cornell-note.entity";
export declare class GetOrCreateCornellNoteUseCase {
    private readonly cornellRepository;
    constructor(cornellRepository: ICornellRepository);
    execute(contentId: string, userId: string): Promise<CornellNote>;
}
