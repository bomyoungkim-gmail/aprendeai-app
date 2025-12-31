import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { UpdateProfileDto } from "./dto/profile.dto";

import { GetProfileUseCase } from "./application/use-cases/get-profile.use-case";
import { UpdateProfileUseCase } from "./application/use-cases/update-profile.use-case";

@Injectable()
export class ProfileService {
  constructor(
    private readonly getProfileUseCase: GetProfileUseCase,
    private readonly updateProfileUseCase: UpdateProfileUseCase,
  ) {}

  async getOrCreate(userId: string) {
    // Delegate to UseCase (which handles creation if not found)
    return this.getProfileUseCase.execute(userId);
  }

  async get(userId: string) {
    return this.getProfileUseCase.execute(userId);
  }

  async update(userId: string, data: UpdateProfileDto) {
    return this.updateProfileUseCase.execute(userId, data);
  }
}
