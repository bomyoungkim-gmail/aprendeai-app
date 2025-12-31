import { Injectable, Inject, NotFoundException } from "@nestjs/common";
import { ISessionsRepository } from "../../domain/sessions.repository.interface";
import { SessionEvent } from "../../domain/reading-session.entity";
import { v4 as uuidv4 } from "uuid";

@Injectable()
export class RecordEventUseCase {
  constructor(
    @Inject(ISessionsRepository) private readonly sessionsRepository: ISessionsRepository,
  ) {}

  async execute(sessionId: string, eventType: string, payload: any): Promise<SessionEvent> {
    const session = await this.sessionsRepository.findById(sessionId);
    if (!session) throw new NotFoundException("Session not found");

    const event = await this.sessionsRepository.addEvent(sessionId, {
        eventType: eventType,
        payload: payload
    });

    return event;
  }
}
