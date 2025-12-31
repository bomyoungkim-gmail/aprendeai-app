import { Injectable, Inject, NotFoundException } from "@nestjs/common";
import { v4 as uuidv4 } from "uuid";
import { ISessionsRepository } from "../../domain/sessions.repository.interface";
import { ReadingSession } from "../../domain/reading-session.entity";
import { ProfileService } from "../../../profiles/profile.service";
import { GatingService } from "../../../gating/gating.service";
import { IContentRepository } from "../../../cornell/domain/content.repository.interface";

@Injectable()
export class StartSessionUseCase {
  constructor(
    @Inject(ISessionsRepository) private readonly sessionsRepository: ISessionsRepository,
    private readonly profileService: ProfileService,
    private readonly gatingService: GatingService,
    @Inject(IContentRepository) private readonly contentRepository: IContentRepository,
  ) {}

  async execute(userId: string, contentId: string): Promise<ReadingSession & { minTargetWords: number }> {
    // 1. Get/create learner profile
    const profile = await this.profileService.getOrCreate(userId);

    // 2. Verify content exists (Via ContentRepository)
    const content = await this.contentRepository.findById(contentId);

    if (!content) {
      throw new NotFoundException("Content not found");
    }

    // 3. Determine appropriate layer based on user eligibility
    const assetLayer = await this.gatingService.determineLayer(
      userId,
      contentId,
    );

    // 4. Create session with phase=PRE
    const session = await this.sessionsRepository.create({
        id: uuidv4(),
        userId: userId,
        contentId: contentId,
        phase: "PRE",
        modality: "READING",
        assetLayer: assetLayer,
        startTime: new Date()
    });

    const minTargetWords = this.getMinTargetWords(profile.educationLevel);

    // Return hybrid object (Entity + metadata)
    // We explicitly cast to avoid strict class method checks on the intersection return 
    // unless we fully hydrate a new class extension. 
    // For now, simpler to return as any or defined DTO in controller.
    return {
        ...session,
        minTargetWords
    } as any;
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
