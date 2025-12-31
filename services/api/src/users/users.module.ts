import { Module } from "@nestjs/common";
import { UsersService } from "./users.service";
import { UsersController } from "./users.controller";
import { PrismaModule } from "../prisma/prisma.module";
import { UsersRepository } from "./infrastructure/users.repository";
import { GetProfileUseCase } from "./application/get-profile.use-case";
import { UpdateProfileUseCase } from "./application/update-profile.use-case";
import { IUsersRepository } from "./domain/users.repository.interface";

@Module({
  imports: [PrismaModule],
  controllers: [UsersController],
  providers: [
    UsersService,
    GetProfileUseCase,
    UpdateProfileUseCase,
    {
      provide: IUsersRepository,
      useClass: UsersRepository,
    },
  ],
  exports: [UsersService, IUsersRepository],
})
export class UsersModule {}
