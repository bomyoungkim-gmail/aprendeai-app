import { Injectable, Inject, BadRequestException, NotFoundException, ForbiddenException } from "@nestjs/common";
import { ISessionsRepository } from "../../domain/sessions.repository.interface";
import { ReadingSession } from "../../domain/reading-session.entity";
import { ProfileService } from "../../../profiles/profile.service";

export interface UpdatePrePhaseData {
  goalStatement: string;
  predictionText: string;
  targetWordsJson: any[];
}

@Injectable()
export class UpdatePrePhaseUseCase {
  constructor(
    @Inject(ISessionsRepository) private readonly sessionsRepository: ISessionsRepository,
    private readonly profileService: ProfileService,
  ) {}

  async execute(sessionId: string, userId: string, data: UpdatePrePhaseData): Promise<ReadingSession> {
    const session = await this.sessionsRepository.findById(sessionId);

    if (!session) throw new NotFoundException("Session not found");
    if (session.userId !== userId) throw new ForbiddenException("Access denied");

    if (session.phase !== "PRE") {
      throw new BadRequestException("Session not in PRE phase");
    }

    // Validate target words count
    // Validate target words count
    const profile = await this.profileService.get(userId);
    const minWords = this.getMinTargetWords(profile.educationLevel);

    if (data.targetWordsJson.length < minWords) {
      throw new BadRequestException(
        `Minimum ${minWords} target words required for ${profile.educationLevel} level`,
      );
    }

    const updated = await this.sessionsRepository.update(sessionId, {
        goalStatement: data.goalStatement,
        predictionText: data.predictionText,
        targetWordsJson: data.targetWordsJson,
        phase: 'DURING',
    });

    return updated;
  }

  private getMinTargetWords(level: string): number {
    const MIN_WORDS = {
      FUNDAMENTAL_1: 3,
      FUNDAMENTAL_2: 4,
      MEDIO: 6,
      SUPERIOR: 8,
      ADULTO_LEIGO: 5,
    };
    return MIN_WORDS[level] || 5;
  }
}
