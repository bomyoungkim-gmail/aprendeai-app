import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  FamilyPolicySetEvent,
  CoSessionStartedEvent,
  CoSessionPhaseChangedEvent,
  EducatorInterventionChosenEvent,
  FamilyAlertRaisedEvent,
  CoSessionFinishedEvent,
  EventSchemas,
} from './schemas/event-schemas';

@Injectable()
export class FamilyEventService {
  constructor(private prisma: PrismaService) {}

  /**
   * Persist a FAMILY event to SessionEvent table
   */
  private async persistEvent(
    sessionId: string,
    userId: string,
    eventPayload: any,
  ) {
    // Validate event schema
    const eventType = eventPayload.type;
    const schema = EventSchemas[eventType];
    
    if (!schema) {
      throw new Error(`Unknown event type: ${eventType}`);
    }

    const validatedPayload = schema.parse(eventPayload);

    // FIX: If sessionId is a "fake" ID (e.g. policy_...), do not link to ReadingSession table
    const isRealSessionId = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(sessionId);

    return this.prisma.sessionEvent.create({
      data: {
        readingSessionId: isRealSessionId ? sessionId : undefined,
        eventType: eventType as any, 
        payloadJson: validatedPayload as any,
      },
    });
  }

  /**
   * FAMILY_POLICY_SET: Family policy created/updated
   */
  async logPolicySet(
    sessionId: string,
    userId: string,
    event: FamilyPolicySetEvent,
  ) {
    return this.persistEvent(sessionId, userId, event);
  }

  /**
   * CO_SESSION_STARTED: Co-reading session initialization
   */
  async logCoSessionStarted(
    sessionId: string,
    userId: string,
    event: CoSessionStartedEvent,
  ) {
    return this.persistEvent(sessionId, userId, event);
  }

  /**
   * CO_SESSION_PHASE_CHANGED: State machine transition
   */
  async logCoSessionPhaseChanged(
    sessionId: string,
    userId: string,
    event: CoSessionPhaseChangedEvent,
  ) {
    return this.persistEvent(sessionId, userId, event);
  }

  /**
   * EDUCATOR_INTERVENTION_CHOSEN: Educator action (A/B/C)
   */
  async logEducatorIntervention(
    sessionId: string,
    userId: string,
    event: EducatorInterventionChosenEvent,
  ) {
    return this.persistEvent(sessionId, userId, event);
  }

  /**
   * FAMILY_ALERT_RAISED: Risk detection (privacy gates apply)
   */
  async logFamilyAlert(
    sessionId: string,
    userId: string,
    event: FamilyAlertRaisedEvent,
  ) {
    return this.persistEvent(sessionId, userId, event);
  }

  /**
   * CO_SESSION_FINISHED: Session completion stats
   */
  async logCoSessionFinished(
    sessionId: string,
    userId: string,
    event: CoSessionFinishedEvent,
  ) {
    return this.persistEvent(sessionId, userId, event);
  }

  /**
   * Query FAMILY events for a given session
   */
  async getSessionEvents(sessionId: string) {
    return this.prisma.sessionEvent.findMany({
      where: {
        readingSessionId: sessionId, // Correct field name
        payloadJson: {
          path: ['domain'],
          equals: 'FAMILY',
        },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  /**
   * Query FAMILY events for a household
   */
  async getHouseholdEvents(householdId: string, limit = 100) {
    return this.prisma.sessionEvent.findMany({
      where: {
        payloadJson: {
          path: ['data', 'householdId'],
          equals: householdId,
        },
      },
      orderBy: { createdAt: 'desc' }, // Fixed: timestamp doesn't exist
      take: limit,
    });
  }
}
