import { Module } from "@nestjs/common";
import { PrismaModule } from "../prisma/prisma.module";
import { ProfileService } from "./profile.service";
import { PrismaProfileRepository } from "./infrastructure/repositories/prisma-profile.repository";
import { IProfileRepository } from "./domain/profile.repository.interface";
import { GetProfileUseCase } from "./application/use-cases/get-profile.use-case";
import { UpdateProfileUseCase } from "./application/use-cases/update-profile.use-case";

@Module({
  imports: [PrismaModule],
  providers: [
    ProfileService,
    GetProfileUseCase,
    UpdateProfileUseCase,
    {
      provide: IProfileRepository,
      useClass: PrismaProfileRepository,
    },
  ],
  exports: [ProfileService, GetProfileUseCase, IProfileRepository],
})
export class ProfileModule {}
