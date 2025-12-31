import { Injectable, Inject } from "@nestjs/common";
import { LogEventUseCase } from "./application/use-cases/log-event.use-case";
import { IEventRepository } from "./domain/interfaces/event.repository.interface";
import {
  FamilyPolicySetEvent,
  CoSessionStartedEvent,
  CoSessionPhaseChangedEvent,
  EducatorInterventionChosenEvent,
  FamilyAlertRaisedEvent,
  CoSessionFinishedEvent,
} from "./schemas/event-schemas";

@Injectable()
export class FamilyEventService {
  constructor(
    private readonly logEventUseCase: LogEventUseCase,
    @Inject(IEventRepository)
    private readonly eventRepo: IEventRepository,
  ) {}

  /**
   * FAMILY_POLICY_SET: Family policy created/updated
   */
  async logPolicySet(
    sessionId: string,
    userId: string,
    event: FamilyPolicySetEvent,
  ) {
    return this.logEventUseCase.execute({ sessionId, userId, event });
  }

  /**
   * CO_SESSION_STARTED: Co-reading session initialization
   */
  async logCoSessionStarted(
    sessionId: string,
    userId: string,
    event: CoSessionStartedEvent,
  ) {
    return this.logEventUseCase.execute({ sessionId, userId, event });
  }

  /**
   * CO_SESSION_PHASE_CHANGED: State machine transition
   */
  async logCoSessionPhaseChanged(
    sessionId: string,
    userId: string,
    event: CoSessionPhaseChangedEvent,
  ) {
    return this.logEventUseCase.execute({ sessionId, userId, event });
  }

  /**
   * EDUCATOR_INTERVENTION_CHOSEN: Educator action (A/B/C)
   */
  async logEducatorIntervention(
    sessionId: string,
    userId: string,
    event: EducatorInterventionChosenEvent,
  ) {
    return this.logEventUseCase.execute({ sessionId, userId, event });
  }

  /**
   * FAMILY_ALERT_RAISED: Risk detection (privacy gates apply)
   */
  async logFamilyAlert(
    sessionId: string,
    userId: string,
    event: FamilyAlertRaisedEvent,
  ) {
    return this.logEventUseCase.execute({ sessionId, userId, event });
  }

  /**
   * CO_SESSION_FINISHED: Session completion stats
   */
  async logCoSessionFinished(
    sessionId: string,
    userId: string,
    event: CoSessionFinishedEvent,
  ) {
    return this.logEventUseCase.execute({ sessionId, userId, event });
  }

  /**
   * Query FAMILY events for a given session
   */
  async getSessionEvents(sessionId: string) {
    return this.eventRepo.getSessionEvents(sessionId, "FAMILY");
  }

  /**
   * Query FAMILY events for a household
   */
  async getHouseholdEvents(householdId: string, limit = 100) {
    return this.eventRepo.getHouseholdEvents(householdId, limit);
  }
}
