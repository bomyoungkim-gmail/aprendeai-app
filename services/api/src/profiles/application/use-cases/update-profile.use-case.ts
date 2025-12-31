import { Injectable, Inject } from "@nestjs/common";
import { IProfileRepository } from "../../domain/profile.repository.interface";
import { Profile } from "../../domain/profile.entity";
import { UpdateProfileDto } from "../../dto/profile.dto";

@Injectable()
export class UpdateProfileUseCase {
  constructor(
    @Inject(IProfileRepository) private readonly profileRepository: IProfileRepository,
  ) {}

  async execute(userId: string, dto: UpdateProfileDto): Promise<Profile> {
    // Ensure exists first (GetOrCreate)
    // We could invoke GetProfileUseCase here but Repo check is lighter if we just want existence.
    // However, Repo update usually throws if not found? Prisma update throws if where fails.
    // Safe bet: try update, catch or ensure existence.
    // The service implementation implies the user already exists or we don't care about creating on update?
    // Usually update requires existence.
    // Let's assume Profile exists or we create it if we want upsert behavior.
    // The original Service `update` method calls `prisma.update`.

    // Check if profile exists, if not create? Prisma update fails if not found.
    // For safety, let's just attempt update.
    
    // In strict Domain, we should find -> update -> save.
    // But leveraging Repo update for efficiency.
    
    return this.profileRepository.update(userId, {
        educationLevel: dto.educationLevel as any, // Cast DTO string to Enum
        dailyTimeBudgetMin: dto.dailyTimeBudgetMin,
        readingLevelScore: dto.readingLevelScore,
        listeningLevelScore: dto.listeningLevelScore,
        writingLevelScore: dto.writingLevelScore,
    });
  }
}
