import { co_reading_sessions } from "@prisma/client";

export class CoReadingSessionMapper {
  static toDto(session: co_reading_sessions) {
    if (!session) return null;

    return {
      id: session.id,
      familyId: session.family_id,
      learnerUserId: session.learner_user_id,
      educatorUserId: session.educator_user_id,
      readingSessionId: session.reading_session_id,
      threadIdLearner: session.thread_id_learner,
      threadIdEducator: session.thread_id_educator,
      timeboxMin: session.timebox_min,
      type: session.type,
      status: session.status,
      startedAt: session.started_at,
      endedAt: session.ended_at,
    };
  }

  static toCollectionDto(sessions: co_reading_sessions[]) {
    return sessions.map((session) => this.toDto(session));
  }
}
