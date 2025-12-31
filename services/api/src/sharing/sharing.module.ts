import { Module } from "@nestjs/common";
import { PrismaModule } from "../prisma/prisma.module";
import { AuthModule } from "../auth/auth.module";
import { SharingService } from "./sharing.service";
import { ThreadsService } from "./threads.service";
import { ContentSharingController } from "./content-sharing.controller";
import { ThreadsController } from "./threads.controller";

// Infrastructure
import { PrismaSharingRepository } from "./infrastructure/repositories/prisma-sharing.repository";

// Use Cases
import { ShareContentUseCase } from "./application/use-cases/share-content.use-case";
import { RevokeContentShareUseCase } from "./application/use-cases/revoke-content-share.use-case";
import { ShareAnnotationUseCase } from "./application/use-cases/share-annotation.use-case";
import { RevokeAnnotationShareUseCase } from "./application/use-cases/revoke-annotation-share.use-case";
import { ISharingRepository } from "./domain/interfaces/sharing.repository.interface";

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [ContentSharingController, ThreadsController],
  providers: [
    SharingService,
    ThreadsService,
    { provide: ISharingRepository, useClass: PrismaSharingRepository },
    ShareContentUseCase,
    RevokeContentShareUseCase,
    ShareAnnotationUseCase,
    RevokeAnnotationShareUseCase,
  ],
  exports: [SharingService, ThreadsService, ISharingRepository],
})
export class SharingModule {}
