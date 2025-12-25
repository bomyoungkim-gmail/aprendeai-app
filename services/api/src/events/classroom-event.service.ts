import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import {
  ClassPolicySetEvent,
  ClassWeeklyPlanCreatedEvent,
  ClassAlertRaisedEvent,
  EventSchemas,
} from "./schemas/event-schemas";

@Injectable()
export class ClassroomEventService {
  constructor(private prisma: PrismaService) {}

  /**
   * Persist a CLASS event to SessionEvent table
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

    // For classroom events using fake IDs (policy_, plan_, help_), do not set readingSessionId
    const isFakeSessionId =
      sessionId.startsWith("policy_") ||
      sessionId.startsWith("plan_") ||
      sessionId.startsWith("help_");

    return this.prisma.sessionEvent.create({
      data: {
        readingSessionId: isFakeSessionId ? undefined : sessionId,
        eventType: eventType as any, // EventType enum
        payloadJson: validatedPayload as any,
        // createdAt auto-generated
      },
    });
  }

  /**
   * CLASS_POLICY_SET: Classroom policy configured
   */
  async logPolicySet(
    sessionId: string,
    userId: string,
    event: ClassPolicySetEvent,
  ) {
    return this.persistEvent(sessionId, userId, event);
  }

  /**
   * CLASS_WEEKLY_PLAN_CREATED: Weekly content plan published
   */
  async logWeeklyPlanCreated(
    sessionId: string,
    userId: string,
    event: ClassWeeklyPlanCreatedEvent,
  ) {
    return this.persistEvent(sessionId, userId, event);
  }

  /**
   * CLASS_ALERT_RAISED: Student help request or risk detected
   */
  async logClassAlert(
    sessionId: string,
    userId: string,
    event: ClassAlertRaisedEvent,
  ) {
    return this.persistEvent(sessionId, userId, event);
  }

  /**
   * Query CLASS events for a classroom
   */
  async getClassroomEvents(classroomId: string, limit = 100) {
    return this.prisma.sessionEvent.findMany({
      where: {
        payloadJson: {
          path: ["data", "classroomId"],
          equals: classroomId,
        },
      },
      orderBy: { createdAt: "desc" }, // Fixed: timestamp doesn't exist
      take: limit,
    });
  }

  /**
   * Query CLASS events for a specific student
   */
  async getStudentEvents(learnerUserId: string, limit = 50) {
    return this.prisma.sessionEvent.findMany({
      where: {
        payloadJson: {
          path: ["data", "learnerUserId"],
          equals: learnerUserId,
        },
      },
      orderBy: { createdAt: "desc" }, // Fixed: timestamp doesn't exist
      take: limit,
    });
  }
}
