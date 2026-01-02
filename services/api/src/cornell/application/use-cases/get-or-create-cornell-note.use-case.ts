import { Injectable, Inject } from "@nestjs/common";
import { ICornellRepository } from "../../domain/interfaces/cornell.repository.interface";
import { CornellNote } from "../../domain/entities/cornell-note.entity";
import * as crypto from "crypto";

@Injectable()
export class GetOrCreateCornellNoteUseCase {
  constructor(
    @Inject(ICornellRepository)
    private readonly cornellRepository: ICornellRepository,
  ) {}

  async execute(contentId: string, userId: string): Promise<CornellNote> {
    let note = await this.cornellRepository.findByContentAndUser(
      contentId,
      userId,
    );

    if (!note) {
      note = new CornellNote({
        id: crypto.randomUUID(),
        contentId,
        userId,
        cues: [],
        notes: [],
        summary: "",
      });
      note = await this.cornellRepository.create(note);
    }

    return note;
  }
}
