import { Injectable, Inject, Logger } from "@nestjs/common";
import {
  IEventRepository,
  IDomainEvent,
} from "../../domain/interfaces/event.repository.interface";
import { EventSchemas } from "../../schemas/event-schemas";
import * as crypto from "crypto";

@Injectable()
export class LogEventUseCase {
  private readonly logger = new Logger(LogEventUseCase.name);

  constructor(
    @Inject(IEventRepository)
    private readonly eventRepo: IEventRepository,
  ) {}

  async execute(dto: {
    sessionId: string;
    userId: string;
    event: any;
  }): Promise<void> {
    const eventType = dto.event.type;
    const schema = EventSchemas[eventType];

    if (!schema) {
      this.logger.error(`Unknown event type: ${eventType}`);
      throw new Error(`Unknown event type: ${eventType}`);
    }

    const validatedPayload = schema.parse(dto.event);

    // Validation logic from existing services (regex and prefixes)
    const isRealSessionId =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        dto.sessionId,
      );
    const isFakeSessionId =
      dto.sessionId.startsWith("policy_") ||
      dto.sessionId.startsWith("plan_") ||
      dto.sessionId.startsWith("help_");

    const domainEvent: IDomainEvent = {
      id: crypto.randomUUID(),
      sessionId:
        isRealSessionId && !isFakeSessionId ? dto.sessionId : undefined,
      type: eventType,
      payload: validatedPayload,
      userId: dto.userId,
      createdAt: new Date(),
    };

    await this.eventRepo.persist(domainEvent);
  }
}
