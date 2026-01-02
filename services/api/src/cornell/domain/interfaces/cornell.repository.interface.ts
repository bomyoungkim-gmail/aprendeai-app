import { CornellNote } from "../entities/cornell-note.entity";

export interface ICornellRepository {
  findByContentAndUser(
    contentId: string,
    userId: string,
  ): Promise<CornellNote | null>;
  create(note: CornellNote): Promise<CornellNote>;
  update(note: CornellNote): Promise<CornellNote>;
}

export const ICornellRepository = Symbol("ICornellRepository");
