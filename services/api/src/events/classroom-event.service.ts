import { Injectable, Inject } from "@nestjs/common";
import { LogEventUseCase } from "./application/use-cases/log-event.use-case";
import { IEventRepository } from "./domain/interfaces/event.repository.interface";
import {
  ClassPolicySetEvent,
  ClassWeeklyPlanCreatedEvent,
  ClassAlertRaisedEvent,
} from "./schemas/event-schemas";

@Injectable()
export class ClassroomEventService {
  constructor(
    private readonly logEventUseCase: LogEventUseCase,
    @Inject(IEventRepository)
    private readonly eventRepo: IEventRepository,
  ) {}

  /**
   * CLASS_POLICY_SET: Classroom policy configured
   */
  async logPolicySet(
    sessionId: string,
    userId: string,
    event: ClassPolicySetEvent,
  ) {
    return this.logEventUseCase.execute({ sessionId, userId, event });
  }

  /**
   * CLASS_WEEKLY_PLAN_CREATED: Weekly content plan published
   */
  async logWeeklyPlanCreated(
    sessionId: string,
    userId: string,
    event: ClassWeeklyPlanCreatedEvent,
  ) {
    return this.logEventUseCase.execute({ sessionId, userId, event });
  }

  /**
   * CLASS_ALERT_RAISED: Student help request or risk detected
   */
  async logClassAlert(
    sessionId: string,
    userId: string,
    event: ClassAlertRaisedEvent,
  ) {
    return this.logEventUseCase.execute({ sessionId, userId, event });
  }

  /**
   * Query CLASS events for a classroom
   */
  async getClassroomEvents(classroomId: string, limit = 100) {
    return this.eventRepo.getClassroomEvents(classroomId, limit);
  }

  /**
   * Query CLASS events for a specific student
   */
  async getStudentEvents(learnerUserId: string, limit = 50) {
    return this.eventRepo.getStudentEvents(learnerUserId, limit);
  }
}
