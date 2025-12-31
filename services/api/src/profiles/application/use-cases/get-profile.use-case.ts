import { Injectable, Inject } from "@nestjs/common";
import { IProfileRepository } from "../../domain/profile.repository.interface";
import { Profile } from "../../domain/profile.entity";

@Injectable()
export class GetProfileUseCase {
  constructor(
    @Inject(IProfileRepository) private readonly profileRepository: IProfileRepository,
  ) {}

  async execute(userId: string): Promise<Profile> {
    const profile = await this.profileRepository.findByUserId(userId);
    
    if (profile) return profile;

    // Default Creation Logic (moved from Service)
    // If not found, creating a default one ("ADULTO_LEIGO" etc.)
    return this.profileRepository.create({
        userId,
        educationLevel: "ADULTO_LEIGO",
        dailyTimeBudgetMin: 30
    });
  }
}
